import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { AuthRepository } from './auth.repository';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Record<string, any>;
}

/** TTL for the password-changed Redis key (24 hours). */
const PWD_CHANGED_TTL = 86400;

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly TOTP_WINDOW = 1;
  private redis!: Redis;

  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
    this.redis.on('error', (err) =>
      this.logger.error('Redis connection error', err),
    );
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async register(data: {
    accountType: 'individual' | 'company';
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country?: string;
    companyName?: string;
    workspaceName?: string;
    workspaceSlug?: string;
    industry?: string;
    teamSize?: string;
    referralSource?: string;
    planSlug?: string;
    billingCycle?: 'monthly' | 'annual';
  }): Promise<AuthTokens & { workspaceId: string }> {
    const existingUser = await this.repository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    const fullName = `${data.firstName} ${data.lastName}`;

    const user = await this.repository.createUser({
      email: data.email,
      passwordHash: hashedPassword,
      name: fullName,
    });

    // Create workspace
    const workspaceName = data.accountType === 'company'
      ? (data.workspaceName || `${data.companyName} Workspace`)
      : `${fullName}'s Workspace`;

    const workspaceSlug = data.workspaceSlug
      || workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const workspace = await this.repository.createDefaultWorkspace(user.id, workspaceName, workspaceSlug);
    await this.repository.createWorkspaceMember(workspace.id, user.id, 'OWNER');
    await this.repository.createUserPreferences(user.id);

    // Assign plan
    if (data.planSlug && data.planSlug !== 'free') {
      await this.repository.assignPlanToWorkspace(workspace.id, user.id, data.planSlug, data.billingCycle || 'monthly');
    }

    // Send verification email
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.repository.storeEmailVerificationToken(user.id, hashedVerifyToken, verifyExpiresAt);

    const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
    await this.repository.enqueueEmail('verify-email', {
      to: user.id,
      email: user.email,
      name: fullName,
      verifyUrl: `${webUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, user: this.sanitizeUser(user), workspaceId: workspace.id };
  }

  async login(email: string, password: string, totpCode?: string): Promise<AuthTokens> {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Please verify your email address before logging in');
    }

    // Check 2FA via preferences
    const userWithPrefs = await this.repository.findUserById(user.id);
    if (userWithPrefs?.preferences?.totp_enabled) {
      if (!totpCode) {
        return {
          accessToken: '',
          refreshToken: '',
          user: { requiresTwoFactor: true, userId: user.id },
        };
      }

      const secret = userWithPrefs.preferences.totp_secret
        ? this.decryptTotpSecret(userWithPrefs.preferences.totp_secret)
        : null;

      if (!secret || !this.verifyTotpCode(secret, totpCode)) {
        throw new UnauthorizedException('Invalid 2FA code');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await this.repository.findRefreshToken(hashedToken);
    if (!storedToken || storedToken.expires < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.repository.deleteRefreshToken(hashedToken);

    const user = await this.repository.findUserById(storedToken.user_id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user.id, user.email);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.repository.deleteRefreshToken(hashedToken);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);
    if (!user) return; // Don't reveal if email exists

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.repository.storePasswordResetToken(user.id, hashedToken, expiresAt);

    const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
    await this.repository.enqueueEmail('password-reset', {
      to: user.id,
      email: user.email,
      name: user.name,
      resetUrl: `${webUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`,
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);
    if (!user || user.email_verified) return;

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.repository.storeEmailVerificationToken(user.id, hashedVerifyToken, verifyExpiresAt);

    const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
    await this.repository.enqueueEmail('verify-email', {
      to: user.id,
      email: user.email,
      name: user.name,
      verifyUrl: `${webUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await this.repository.findPasswordResetToken(hashedToken);

    if (!resetRecord || resetRecord.expires_at < new Date() || resetRecord.used_at) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await this.repository.updateUserPassword(resetRecord.user_id, hashedPassword);
    await this.repository.markPasswordResetTokenUsed(resetRecord.id);
    await this.repository.deleteAllRefreshTokensForUser(resetRecord.user_id);

    // Invalidate all existing JWTs by recording password change time
    await this.redis.set(
      `auth:pwd_changed:${resetRecord.user_id}`,
      Date.now().toString(),
      'EX',
      PWD_CHANGED_TTL,
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verifyRecord = await this.repository.findEmailVerificationToken(hashedToken);

    if (!verifyRecord || verifyRecord.expires_at < new Date() || verifyRecord.used_at) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.repository.markEmailVerified(verifyRecord.user_id);
    await this.repository.markEmailVerificationTokenUsed(verifyRecord.id);
  }

  async enableTwoFactor(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const secret = crypto.randomBytes(20).toString('hex');
    const encryptedSecret = this.encryptTotpSecret(secret);
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, this.SALT_ROUNDS)),
    );

    await this.repository.storeTotpSecret(userId, encryptedSecret);
    await this.repository.storeBackupCodes(userId, hashedBackupCodes);

    const user = await this.repository.findUserById(userId);
    const issuer = 'MyManager';
    const qrCodeUrl = `otpauth://totp/${issuer}:${user!.email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    return { secret, qrCodeUrl, backupCodes };
  }

  async verifyTwoFactor(userId: string, code: string): Promise<{ verified: boolean }> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.preferences?.totp_secret) {
      throw new BadRequestException('2FA not initialized');
    }

    const secret = this.decryptTotpSecret(user.preferences.totp_secret);
    const isValid = this.verifyTotpCode(secret, code);

    if (isValid) {
      await this.repository.enableTwoFactor(userId);
      return { verified: true };
    }

    throw new UnauthorizedException('Invalid 2FA code');
  }

  async disableTwoFactor(userId: string, code: string): Promise<{ disabled: boolean }> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.preferences?.totp_secret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const secret = this.decryptTotpSecret(user.preferences.totp_secret);
    const isValid = this.verifyTotpCode(secret, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.repository.disableTwoFactor(userId);
    return { disabled: true };
  }

  async getCurrentUser(userId: string): Promise<Record<string, any>> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async handleGoogleAuth(code: string, redirectUri: string): Promise<AuthTokens> {
    const googleTokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    const tokenResponse = await fetch(googleTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenResponse.json()) as { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string };

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = (await userInfoResponse.json()) as { id: string; email: string; name: string; picture?: string; verified_email?: boolean };

    let user = await this.repository.findUserByEmail(googleUser.email);
    if (!user) {
      user = await this.repository.createUser({
        email: googleUser.email,
        name: googleUser.name,
        passwordHash: '',
        emailVerified: true,
        avatarUrl: googleUser.picture,
      });
      const workspace = await this.repository.createDefaultWorkspace(user.id, `${googleUser.name}'s Workspace`);
      await this.repository.createWorkspaceMember(workspace.id, user.id, 'OWNER');
      await this.repository.createUserPreferences(user.id);
    }

    await this.repository.upsertOAuthAccount(user.id, 'google', googleUser.id, tokenData);

    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async handleAppleAuth(code: string, idToken: string): Promise<AuthTokens> {
    // Verify Apple ID token using Apple's public keys
    const decoded = await this.verifyAppleIdToken(idToken);
    if (!decoded || !decoded.email) {
      throw new UnauthorizedException('Invalid Apple ID token');
    }

    let user = await this.repository.findUserByEmail(decoded.email);
    if (!user) {
      user = await this.repository.createUser({
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        passwordHash: '',
        emailVerified: true,
      });
      const workspace = await this.repository.createDefaultWorkspace(user.id, `${decoded.name || 'My'} Workspace`);
      await this.repository.createWorkspaceMember(workspace.id, user.id, 'OWNER');
      await this.repository.createUserPreferences(user.id);
    }

    await this.repository.upsertOAuthAccount(user.id, 'apple', decoded.sub, { idToken });

    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async getPaymentStatus(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    const subscription = await this.repository.findActiveSubscription(userId);
    if (!subscription) {
      return {
        status: user.status,
        hasActiveSubscription: false,
        plan: null,
        requiresPayment: user.status === 'PENDING_PAYMENT',
      };
    }

    return {
      status: user.status,
      hasActiveSubscription: true,
      plan: {
        id: (subscription as unknown as { plan?: { id: string; name: string; slug: string } }).plan?.id,
        name: (subscription as unknown as { plan?: { id: string; name: string; slug: string } }).plan?.name,
        slug: (subscription as unknown as { plan?: { id: string; name: string; slug: string } }).plan?.slug,
      },
      subscriptionStatus: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      requiresPayment: false,
    };
  }

  async validateSlug(slug: string): Promise<{ available: boolean; slug: string; suggestion?: string }> {
    if (!slug || slug.length < 3) {
      return { available: false, slug, suggestion: undefined };
    }

    const normalized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '');
    const existing = await this.repository.findWorkspaceBySlug(normalized);

    if (!existing) {
      return { available: true, slug: normalized };
    }

    // Generate a suggestion
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return {
      available: false,
      slug: normalized,
      suggestion: `${normalized}-${suffix}`,
    };
  }

  private async generateTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.repository.findUserById(userId);
    const payload = { sub: userId, email, is_superadmin: user?.is_superadmin ?? false };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.repository.storeRefreshToken(userId, hashedRefreshToken, expires);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: Record<string, any>): Record<string, any> {
    const sanitized = { ...user };
    delete sanitized.password_hash;

    const preferences = sanitized.preferences;
    if (preferences) {
      const safePreferences = { ...preferences };
      delete safePreferences.totp_secret;
      return { ...sanitized, preferences: safePreferences };
    }
    return sanitized;
  }

  private async verifyAppleIdToken(idToken: string): Promise<{ sub: string; email: string; name?: string }> {
    // Fetch Apple's public keys
    const response = await fetch('https://appleid.apple.com/auth/keys');
    const { keys } = (await response.json()) as { keys: Array<{ kid: string; kty: string; [key: string]: unknown }> };

    // Decode the JWT header to find the key id
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const key = keys.find((k) => k.kid === header.kid);

    if (!key) {
      throw new UnauthorizedException('Apple public key not found');
    }

    // Convert JWK to PEM and verify
    const jwkToPem = await import('crypto');
    const publicKey = jwkToPem.createPublicKey({ key, format: 'jwk' });

    try {
      const payload = this.jwtService.verify(idToken, {
        algorithms: ['RS256'],
        publicKey: publicKey.export({ type: 'spki', format: 'pem' }) as string,
        issuer: 'https://appleid.apple.com',
        audience: this.configService.get<string>('APPLE_CLIENT_ID'),
      } as Record<string, any>);
      return payload;
    } catch (_err) {
      throw new UnauthorizedException('Apple ID token verification failed');
    }
  }

  private encryptTotpSecret(secret: string): string {
    const key = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY')!, 'hex');
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decryptTotpSecret(encryptedSecret: string): string {
    const key = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY')!, 'hex');
    const parts = encryptedSecret.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted secret format — expected GCM format (iv:authTag:ciphertext)');
    }
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private verifyTotpCode(secret: string, code: string): boolean {
    const period = 30;
    const digits = 6;
    const time = Math.floor(Date.now() / 1000 / period);

    for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
      const counter = time + i;
      const buffer = Buffer.alloc(8);
      buffer.writeBigUInt64BE(BigInt(counter));

      const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
      hmac.update(buffer);
      const hash = hmac.digest();

      const offset = hash[hash.length - 1] & 0xf;
      const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

      const otp = (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
      if (otp === code) return true;
    }

    return false;
  }
}
