import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface AppleUserProfile {
  sub: string;
  email: string;
  name?: string;
  email_verified: boolean;
}

@Injectable()
export class AppleStrategy {
  private readonly clientId: string;
  private readonly teamId: string;
  private readonly keyId: string;
  private readonly privateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('APPLE_CLIENT_ID') || '';
    this.teamId = this.configService.get<string>('APPLE_TEAM_ID') || '';
    this.keyId = this.configService.get<string>('APPLE_KEY_ID') || '';
    this.privateKey = this.configService.get<string>('APPLE_PRIVATE_KEY') || '';
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code id_token',
      scope: 'name email',
      response_mode: 'form_post',
      state,
    });
    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  generateClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: this.keyId })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: this.teamId,
      iat: now,
      exp: now + 15777000, // 6 months
      aud: 'https://appleid.apple.com',
      sub: this.clientId,
    })).toString('base64url');

    const signInput = `${header}.${payload}`;
    const sign = crypto.createSign('SHA256');
    sign.update(signInput);
    const signature = sign.sign(this.privateKey, 'base64url');

    return `${signInput}.${signature}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    idToken: string;
  }> {
    const clientSecret = this.generateClientSecret();

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = (await response.json()) as { access_token: string; refresh_token: string; id_token: string };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    };
  }

  decodeIdToken(idToken: string): AppleUserProfile {
    const parts = idToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified === 'true' || payload.email_verified === true,
    };
  }

  async verifyIdToken(idToken: string): Promise<AppleUserProfile> {
    const keysResponse = await fetch('https://appleid.apple.com/auth/keys');
    const keys = (await keysResponse.json()) as { keys: Array<{ kid: string; kty: string; [key: string]: unknown }> };

    const headerStr = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64url').toString('utf8')) as { kid: string; alg: string };
    const signingKey = keys.keys.find((k) => k.kid === headerStr.kid);

    if (!signingKey) {
      throw new Error('Apple signing key not found');
    }

    const publicKey = crypto.createPublicKey({
      key: signingKey,
      format: 'jwk',
    });

    const [headerB64, payloadB64, signatureB64] = idToken.split('.');
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    const isValid = verifier.verify(publicKey, signatureB64, 'base64url');

    if (!isValid) {
      throw new Error('Apple ID token signature verification failed');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      sub: string; email: string; email_verified: boolean; iss: string; aud: string; exp?: number;
    };

    if (payload.iss !== 'https://appleid.apple.com' || payload.aud !== this.clientId) {
      throw new Error('Apple ID token claims verification failed');
    }

    // Verify token has not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Apple ID token has expired');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
    };
  }
}
