import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import axios from 'axios';

interface TokenRefreshJobData {
  socialAccountId: string;
}

const PLATFORM_TOKEN_URLS: Record<string, string> = {
  facebook: 'https://graph.facebook.com/v21.0/oauth/access_token',
  instagram: 'https://graph.facebook.com/v21.0/oauth/access_token',
  x: 'https://api.twitter.com/2/oauth2/token',
  linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
  tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
  'google-business': 'https://oauth2.googleapis.com/token',
  pinterest: 'https://api.pinterest.com/v5/oauth/token',
  youtube: 'https://oauth2.googleapis.com/token',
  threads: 'https://graph.facebook.com/v21.0/oauth/access_token',
};

export class TokenRefreshWorker {
  constructor(private readonly prisma: PrismaService) {}

  async process(job: Job<TokenRefreshJobData>): Promise<void> {
    const { socialAccountId } = job.data;
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
      include: { platform: true },
    });
    if (!account || !account.refresh_token_encrypted) return;

    const platformSlug = account.platform.slug;
    const tokenUrl = PLATFORM_TOKEN_URLS[platformSlug];
    if (!tokenUrl) return;

    const decryptedRefreshToken = this.decryptToken(account.refresh_token_encrypted);
    const { clientId, clientSecret } = this.getClientCredentials(platformSlug);

    try {
      const response = await axios.post(tokenUrl, new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const newAccessToken = this.encryptToken(response.data.access_token);
      const newRefreshToken = response.data.refresh_token
        ? this.encryptToken(response.data.refresh_token)
        : account.refresh_token_encrypted;
      const expiresAt = response.data.expires_in
        ? new Date(Date.now() + response.data.expires_in * 1000)
        : null;

      await this.prisma.socialAccount.update({
        where: { id: socialAccountId },
        data: {
          access_token_encrypted: newAccessToken,
          refresh_token_encrypted: newRefreshToken,
          token_expires_at: expiresAt,
          is_active: true,
          last_used_at: new Date(),
        },
      });
    } catch (error: unknown) {
      await this.prisma.socialAccount.update({
        where: { id: socialAccountId },
        data: { is_active: false },
      });
      throw error;
    }
  }

  private getClientCredentials(platform: string): { clientId: string; clientSecret: string } {
    const mapping: Record<string, { idEnv: string; secretEnv: string }> = {
      facebook: { idEnv: 'FACEBOOK_APP_ID', secretEnv: 'FACEBOOK_APP_SECRET' },
      instagram: { idEnv: 'FACEBOOK_APP_ID', secretEnv: 'FACEBOOK_APP_SECRET' },
      threads: { idEnv: 'FACEBOOK_APP_ID', secretEnv: 'FACEBOOK_APP_SECRET' },
      x: { idEnv: 'TWITTER_CLIENT_ID', secretEnv: 'TWITTER_CLIENT_SECRET' },
      linkedin: { idEnv: 'LINKEDIN_CLIENT_ID', secretEnv: 'LINKEDIN_CLIENT_SECRET' },
      tiktok: { idEnv: 'TIKTOK_CLIENT_KEY', secretEnv: 'TIKTOK_CLIENT_SECRET' },
      'google-business': { idEnv: 'GOOGLE_CLIENT_ID', secretEnv: 'GOOGLE_CLIENT_SECRET' },
      youtube: { idEnv: 'GOOGLE_CLIENT_ID', secretEnv: 'GOOGLE_CLIENT_SECRET' },
      pinterest: { idEnv: 'PINTEREST_APP_ID', secretEnv: 'PINTEREST_APP_SECRET' },
    };
    const m = mapping[platform] || { idEnv: '', secretEnv: '' };
    return { clientId: process.env[m.idEnv] || '', clientSecret: process.env[m.secretEnv] || '' };
  }

  private encryptToken(token: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decryptToken(encrypted: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const parts = encrypted.split(':');
    // Support legacy CBC format (iv:ciphertext) by falling back
    if (parts.length === 2) {
      const [ivHex, cipherHex] = parts;
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
      return decipher.update(cipherHex, 'hex', 'utf8') + decipher.final('utf8');
    }
    // GCM format (iv:authTag:ciphertext)
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(cipherHex, 'hex', 'utf8') + decipher.final('utf8');
  }
}
