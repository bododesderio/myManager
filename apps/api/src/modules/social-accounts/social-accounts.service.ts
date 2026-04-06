import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SocialAccountsRepository } from './social-accounts.repository';

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

@Injectable()
export class SocialAccountsService {
  private readonly platformConfigs: Record<string, OAuthConfig>;

  constructor(
    private readonly repository: SocialAccountsRepository,
    private readonly configService: ConfigService,
  ) {
    this.platformConfigs = {
      facebook: {
        authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        clientId: this.configService.get('FACEBOOK_APP_ID')!,
        clientSecret: this.configService.get('FACEBOOK_APP_SECRET')!,
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'pages_read_user_content'],
      },
      instagram: {
        authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        clientId: this.configService.get('FACEBOOK_APP_ID')!,
        clientSecret: this.configService.get('FACEBOOK_APP_SECRET')!,
        scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      },
      x: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        clientId: this.configService.get('TWITTER_CLIENT_ID')!,
        clientSecret: this.configService.get('TWITTER_CLIENT_SECRET')!,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      },
      linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        clientId: this.configService.get('LINKEDIN_CLIENT_ID')!,
        clientSecret: this.configService.get('LINKEDIN_CLIENT_SECRET')!,
        scopes: ['r_liteprofile', 'w_member_social', 'r_organization_social'],
      },
      tiktok: {
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
        clientId: this.configService.get('TIKTOK_CLIENT_KEY')!,
        clientSecret: this.configService.get('TIKTOK_CLIENT_SECRET')!,
        scopes: ['user.info.basic', 'video.publish', 'video.upload'],
      },
      'google-business': {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: this.configService.get('GOOGLE_CLIENT_ID')!,
        clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET')!,
        scopes: ['https://www.googleapis.com/auth/business.manage'],
      },
      pinterest: {
        authUrl: 'https://www.pinterest.com/oauth/',
        tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
        clientId: this.configService.get('PINTEREST_APP_ID')!,
        clientSecret: this.configService.get('PINTEREST_APP_SECRET')!,
        scopes: ['boards:read', 'pins:read', 'pins:write'],
      },
      youtube: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: this.configService.get('GOOGLE_CLIENT_ID')!,
        clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET')!,
        scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
      },
      threads: {
        authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        clientId: this.configService.get('FACEBOOK_APP_ID')!,
        clientSecret: this.configService.get('FACEBOOK_APP_SECRET')!,
        scopes: ['threads_basic', 'threads_content_publish', 'threads_manage_insights'],
      },
    };
  }

  async listByWorkspace(workspaceId: string) {
    return this.repository.findByWorkspace(workspaceId);
  }

  async initiateOAuth(platform: string, userId: string, workspaceId: string, redirectUri: string) {
    const config = this.platformConfigs[platform];
    if (!config) throw new BadRequestException(`Unsupported platform: ${platform}`);

    const state = crypto.randomBytes(32).toString('hex');
    await this.repository.storeOAuthState(state, { platform, userId, workspaceId, redirectUri });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
    });

    if (platform === 'x') {
      params.set('code_challenge', state);
      params.set('code_challenge_method', 'plain');
    }

    return { authorizationUrl: `${config.authUrl}?${params.toString()}` };
  }

  async handleOAuthCallback(platform: string, code: string, state: string, workspaceId: string) {
    const storedState = await this.repository.getOAuthState(state);
    if (!storedState) throw new BadRequestException('Invalid or expired OAuth state');
    if (storedState.platform !== platform) {
      throw new BadRequestException('OAuth state does not match requested platform');
    }
    if (workspaceId && storedState.workspaceId && workspaceId !== storedState.workspaceId) {
      throw new BadRequestException('Workspace mismatch for OAuth callback');
    }

    const config = this.platformConfigs[platform];
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: storedState.redirectUri,
      }).toString(),
    });

    const tokens = (await tokenResponse.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    const encryptedAccessToken = this.encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? this.encryptToken(tokens.refresh_token) : null;

    const profile = await this.fetchPlatformProfile(platform, tokens.access_token);

    const account = await this.repository.upsert({
      workspace_id: storedState.workspaceId,
      platform_id: platform,
      platform_user_id: profile.id,
      platform_username: profile.username,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      is_active: true,
    });

    await this.repository.deleteOAuthState(state);
    return account;
  }

  async getById(id: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException('Social account not found');
    const { access_token_encrypted: _access_token_encrypted, refresh_token_encrypted: _refresh_token_encrypted, ...safe } = account;
    return safe;
  }

  async update(id: string, data: { metadata?: Record<string, unknown> }) {
    return this.repository.update(id, data);
  }

  async disconnect(id: string) {
    await this.repository.update(id, { is_active: false, access_token_encrypted: null, refresh_token_encrypted: null });
    return { message: 'Account disconnected' };
  }

  async refreshToken(id: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException('Social account not found');
    if (!account.refresh_token_encrypted) throw new BadRequestException('No refresh token available');

    const config = this.platformConfigs[account.platform_id];
    const decryptedRefreshToken = this.decryptToken(account.refresh_token_encrypted);

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const tokens = (await response.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    const encryptedAccessToken = this.encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? this.encryptToken(tokens.refresh_token)
      : account.refresh_token_encrypted;

    await this.repository.update(id, {
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      is_active: true,
    });

    return { message: 'Token refreshed successfully' };
  }

  async validate(id: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException('Social account not found');

    try {
      const decryptedToken = this.decryptToken(account.access_token_encrypted);
      await this.fetchPlatformProfile(account.platform_id, decryptedToken);
      return { valid: true, platform: account.platform_id };
    } catch {
      await this.repository.update(id, { is_active: false });
      return { valid: false, platform: account.platform_id, reason: 'Token is no longer valid' };
    }
  }

  async listSupportedPlatforms() {
    return this.repository.findAllPlatforms();
  }

  private async fetchPlatformProfile(platform: string, accessToken: string): Promise<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  }> {
    const profileEndpoints: Record<string, string> = {
      facebook: 'https://graph.facebook.com/v21.0/me?fields=id,name,picture',
      instagram: 'https://graph.facebook.com/v21.0/me?fields=id,username,name,profile_picture_url',
      x: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
      linkedin: 'https://api.linkedin.com/v2/me',
      tiktok: 'https://open.tiktokapis.com/v2/user/info/',
      'google-business': 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      pinterest: 'https://api.pinterest.com/v5/user_account',
      youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      threads: 'https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url',
    };

    const response = await fetch(profileEndpoints[platform], {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await response.json()) as {
      id?: string;
      name?: string;
      username?: string;
      email?: string;
      picture?: { data?: { url?: string } };
      profile_picture_url?: string;
      profile_image_url?: string;
      data?: { user?: { open_id?: string; display_name?: string } };
    };

    return {
      id: data.id || data.data?.user?.open_id || 'unknown',
      username: data.username || data.name || data.data?.user?.display_name || '',
      displayName: data.name || data.username || data.data?.user?.display_name || '',
      avatarUrl: data.picture?.data?.url || data.profile_picture_url || data.profile_image_url || '',
    };
  }

  private encryptToken(token: string): string {
    const key = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY')!, 'hex');
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decryptToken(encryptedToken: string): string {
    const key = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY')!, 'hex');
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format — expected GCM format (iv:authTag:ciphertext)');
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
}
