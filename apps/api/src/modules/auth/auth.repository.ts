import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    emailVerified?: boolean;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.passwordHash,
        name: data.name,
        email_verified: data.emailVerified ?? false,
        avatar_url: data.avatarUrl,
      },
    });
  }

  /**
   * Create a user and everything that must exist for that user to be usable, in
   * a single transaction.
   *
   * Previously these were five sequential writes. A failure partway through left
   * a user who owned no workspace and belonged to none — unable to use the app,
   * and unable to re-register because the unique-email check would then reject
   * them. Registration is all-or-nothing.
   */
  async createUserWithWorkspace(data: {
    email: string;
    passwordHash: string;
    name: string;
    workspaceName: string;
    workspaceSlug: string;
    planSlug?: string;
    billingCycle?: string;
    emailVerificationTokenHash: string;
    emailVerificationExpiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password_hash: data.passwordHash,
          name: data.name,
          email_verified: false,
        },
      });

      const workspace = await tx.workspace.create({
        data: { name: data.workspaceName, slug: data.workspaceSlug },
      });

      await tx.workspaceMember.create({
        data: {
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'OWNER' as WorkspaceRole,
        },
      });

      await tx.userPreferences.create({
        data: {
          user_id: user.id,
          language: 'en',
          currency: 'USD',
          timezone: 'UTC',
          theme: 'system',
        },
      });

      if (data.planSlug && data.planSlug !== 'free') {
        const plan = await tx.plan.findUnique({ where: { slug: data.planSlug } });
        if (plan) {
          const isAnnual = data.billingCycle === 'annual';
          await tx.subscription.create({
            data: {
              workspace_id: workspace.id,
              user_id: user.id,
              plan_id: plan.id,
              status: 'ACTIVE',
              billing_cycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
              current_period_start: new Date(),
              current_period_end: new Date(
                Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000,
              ),
              locked_limits: (plan.limits as Record<string, any>) ?? {},
              locked_features: (plan.features as Record<string, any>) ?? {},
            },
          });
        }
      }

      await tx.$executeRaw`DELETE FROM email_verification_tokens WHERE user_id = ${user.id}`;
      await tx.$executeRaw`INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (gen_random_uuid(), ${user.id}, ${data.emailVerificationTokenHash}, ${data.emailVerificationExpiresAt}, NOW())`;

      return { user, workspace };
    });
  }

  async createDefaultWorkspace(userId: string, name: string, slug?: string) {
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.workspace.create({
      data: { name, slug: finalSlug },
    });
  }

  async assignPlanToWorkspace(workspaceId: string, userId: string, planSlug: string, billingCycle: string) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) return;

    return this.prisma.subscription.create({
      data: {
        workspace_id: workspaceId,
        user_id: userId,
        plan_id: plan.id,
        status: 'ACTIVE',
        billing_cycle: billingCycle === 'annual' ? 'ANNUAL' : 'MONTHLY',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
        locked_limits: (plan.limits as Record<string, any>) ?? {},
        locked_features: (plan.features as Record<string, any>) ?? {},
      },
    });
  }

  async createWorkspaceMember(workspaceId: string, userId: string, role: string) {
    return this.prisma.workspaceMember.create({
      data: { workspace_id: workspaceId, user_id: userId, role: role as WorkspaceRole },
    });
  }

  async createUserPreferences(userId: string) {
    return this.prisma.userPreferences.create({
      data: {
        user_id: userId,
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        theme: 'system',
      },
    });
  }

  async storeRefreshToken(userId: string, tokenHash: string, expires: Date) {
    return this.prisma.refreshToken.create({
      data: { user_id: userId, token_hash: tokenHash, expires_at: expires },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });
  }

  /**
   * Attempt to consume a refresh token as part of rotation, with reuse
   * detection. Returns a discriminated result the service acts on:
   *
   * - `rotated`  — token was valid and unused; it is now marked used and the
   *                caller may mint a replacement.
   * - `reuse`    — the token exists but was already used or revoked. This is
   *                the classic stolen-token replay: the family must be revoked.
   * - `invalid`  — no such token, or it is expired.
   *
   * The consume is atomic: `updateMany` with a `used_at: null, revoked_at: null`
   * guard means only one of two concurrent refreshes flips the row (count === 1);
   * the loser reads back a now-used row and is reported as reuse, so a genuine
   * double-submit is indistinguishable from theft and fails safe.
   */
  async consumeRefreshToken(
    tokenHash: string,
    now: Date = new Date(),
  ): Promise<
    | { status: 'rotated'; userId: string }
    | { status: 'reuse'; userId: string }
    | { status: 'invalid' }
  > {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({
        where: { token_hash: tokenHash },
      });
      if (!existing) return { status: 'invalid' as const };

      if (existing.used_at || existing.revoked_at) {
        return { status: 'reuse' as const, userId: existing.user_id };
      }
      if (existing.expires_at <= now) {
        return { status: 'invalid' as const };
      }

      const consumed = await tx.refreshToken.updateMany({
        where: { token_hash: tokenHash, used_at: null, revoked_at: null },
        data: { used_at: now },
      });
      if (consumed.count !== 1) {
        // Lost the race to a concurrent refresh — treat as reuse, fail safe.
        return { status: 'reuse' as const, userId: existing.user_id };
      }
      return { status: 'rotated' as const, userId: existing.user_id };
    });
  }

  /** Revoke a single refresh token (logout). Idempotent; retains the row so a
   *  later replay of the same token is still detectable as reuse. */
  async revokeRefreshToken(tokenHash: string, now: Date = new Date()) {
    return this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: now },
    });
  }

  /** Revoke every live refresh token for a user — used on reuse detection,
   *  password reset and "sign out all devices". */
  async revokeAllRefreshTokensForUser(userId: string, now: Date = new Date()) {
    return this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: now },
    });
  }

  /** Delete expired refresh tokens. Called by the cleanup cron. Once a token is
   *  past expiry it can no longer be presented, so retaining it buys no further
   *  reuse detection. */
  async deleteExpiredRefreshTokens(now: Date = new Date()) {
    return this.prisma.refreshToken.deleteMany({
      where: { expires_at: { lt: now } },
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
      },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { email_verified: true },
    });
  }

  async storeTotpSecret(userId: string, encryptedSecret: string) {
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_secret: encryptedSecret },
    });
  }

  async storeBackupCodes(userId: string, hashedCodes: string[]) {
    await this.prisma.totpBackupCode.deleteMany({ where: { user_id: userId } });
    return this.prisma.totpBackupCode.createMany({
      data: hashedCodes.map((code) => ({
        user_id: userId,
        code_hash: code,
        used: false,
      })),
    });
  }

  async enableTwoFactor(userId: string) {
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_enabled: true },
    });
  }

  async disableTwoFactor(userId: string) {
    await this.prisma.totpBackupCode.deleteMany({ where: { user_id: userId } });
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_enabled: false, totp_secret: null },
    });
  }

  async upsertOAuthAccount(userId: string, provider: string, providerAccountId: string, tokenData: Record<string, any>) {
    return this.prisma.account.upsert({
      where: {
        provider_provider_account_id: { provider, provider_account_id: providerAccountId },
      },
      update: {
        access_token: tokenData.access_token || tokenData.idToken,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      },
      create: {
        user_id: userId,
        provider,
        provider_account_id: providerAccountId,
        type: 'oauth',
        access_token: tokenData.access_token || tokenData.idToken,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      },
    });
  }

  async storePasswordResetToken(userId: string, hashedToken: string, expiresAt: Date) {
    // Delete any existing tokens for this user
    await this.prisma.$executeRaw`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
    await this.prisma.$executeRaw`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (gen_random_uuid(), ${userId}, ${hashedToken}, ${expiresAt}, NOW())`;
  }

  async findPasswordResetToken(hashedToken: string) {
    const results = await this.prisma.$queryRaw<Array<{ id: string; user_id: string; token_hash: string; expires_at: Date; used_at: Date | null }>>`SELECT * FROM password_reset_tokens WHERE token_hash = ${hashedToken} LIMIT 1`;
    return results[0] || null;
  }

  async markPasswordResetTokenUsed(id: string) {
    await this.prisma.$executeRaw`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${id}`;
  }

  async storeEmailVerificationToken(userId: string, hashedToken: string, expiresAt: Date) {
    await this.prisma.$executeRaw`DELETE FROM email_verification_tokens WHERE user_id = ${userId}`;
    await this.prisma.$executeRaw`INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (gen_random_uuid(), ${userId}, ${hashedToken}, ${expiresAt}, NOW())`;
  }

  async findEmailVerificationToken(hashedToken: string) {
    const results = await this.prisma.$queryRaw<Array<{ id: string; user_id: string; token_hash: string; expires_at: Date; used_at: Date | null }>>`SELECT * FROM email_verification_tokens WHERE token_hash = ${hashedToken} LIMIT 1`;
    return results[0] || null;
  }

  async markEmailVerificationTokenUsed(id: string) {
    await this.prisma.$executeRaw`UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ${id}`;
  }

  async findActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { user_id: userId, status: { in: ['ACTIVE', 'CANCELLING'] } },
      include: { plan: true },
    });
  }

  async findWorkspaceBySlug(slug: string) {
    return this.prisma.workspace.findUnique({ where: { slug } });
  }

  async enqueueEmail(template: string, data: Record<string, any>) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && data.email) {
      const resend = new Resend(resendApiKey);
      const subjectMap: Record<string, string> = {
        'verify-email': 'Verify your email address',
        'password-reset': 'Reset your password',
      };

      const verifyUrl = data.verifyUrl as string | undefined;
      const resetUrl = data.resetUrl as string | undefined;
      const htmlMap: Record<string, string | undefined> = {
        'verify-email': verifyUrl
          ? `<p>Hi ${data.name || 'there'},</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p>`
          : undefined,
        'password-reset': resetUrl
          ? `<p>Hi ${data.name || 'there'},</p><p>You requested a password reset. Click the link below to choose a new password:</p><p><a href="${resetUrl}">Reset Password</a></p>`
          : undefined,
      };

      const subject = subjectMap[template];
      const html = htmlMap[template];

      if (subject && html) {
        await resend.emails.send({
          from: `${process.env.BRAND_NAME || 'MyManager'} <noreply@${process.env.EMAIL_DOMAIN || 'mymanager.com'}>`,
          to: data.email,
          subject,
          html,
        });
      }
    }

    return this.prisma.notification.create({
      data: {
        user_id: data.to,
        type: 'email',
        title: template,
        body: JSON.stringify(data),
        read: false,
      },
    });
  }
}
