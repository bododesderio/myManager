import { createHash } from 'crypto';
import { SocialAccountsService } from './social-accounts.service';

/**
 * Locks in the provider-specific OAuth authorize contracts that are easy to get
 * subtly wrong (and were: TikTok used client_id + no PKCE; LinkedIn used the
 * deprecated r_liteprofile scopes).
 */
describe('SocialAccountsService.initiateOAuth', () => {
  const ENV: Record<string, string> = {
    TIKTOK_CLIENT_KEY: 'tt-key',
    TIKTOK_CLIENT_SECRET: 'tt-secret',
    LINKEDIN_CLIENT_ID: 'li-id',
    LINKEDIN_CLIENT_SECRET: 'li-secret',
    TWITTER_CLIENT_ID: 'x-id',
    TWITTER_CLIENT_SECRET: 'x-secret',
    FACEBOOK_APP_ID: 'fb-id',
    FACEBOOK_APP_SECRET: 'fb-secret',
  };

  function createService() {
    const stored: Record<string, unknown>[] = [];
    const repository = {
      storeOAuthState: jest
        .fn()
        .mockImplementation(async (_state: string, data: Record<string, unknown>) => {
          stored.push(data);
        }),
    };
    const configService = { get: (k: string) => ENV[k] };
    const service = new SocialAccountsService(
      repository as unknown as ConstructorParameters<typeof SocialAccountsService>[0],
      configService as unknown as ConstructorParameters<typeof SocialAccountsService>[1],
    );
    return { service, stored };
  }

  const REDIRECT = 'http://localhost:3000/connect/oauth';

  it('TikTok: uses client_key, S256 PKCE, and the correct scopes', async () => {
    const { service, stored } = await createService();
    const { authorizationUrl } = await service.initiateOAuth('tiktok', 'u1', 'w1', REDIRECT);
    const url = new URL(authorizationUrl);

    expect(url.origin + url.pathname).toBe('https://www.tiktok.com/v2/auth/authorize/');
    expect(url.searchParams.get('client_key')).toBe('tt-key');
    expect(url.searchParams.get('client_id')).toBeNull(); // must NOT be client_id
    expect(url.searchParams.get('scope')).toBe('user.info.basic video.publish video.upload');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');

    // The challenge must be the SHA-256 of the stored verifier.
    const verifier = stored[0].codeVerifier as string;
    const expectedChallenge = createHash('sha256').update(verifier).digest('base64url');
    expect(url.searchParams.get('code_challenge')).toBe(expectedChallenge);
  });

  it('LinkedIn: uses client_id, OIDC scopes, and no PKCE', async () => {
    const { service, stored } = await createService();
    const { authorizationUrl } = await service.initiateOAuth('linkedin', 'u1', 'w1', REDIRECT);
    const url = new URL(authorizationUrl);

    expect(url.searchParams.get('client_id')).toBe('li-id');
    expect(url.searchParams.get('scope')).toBe('openid profile email w_member_social');
    // No legacy scopes.
    expect(authorizationUrl).not.toContain('r_liteprofile');
    expect(authorizationUrl).not.toContain('r_organization_social');
    // LinkedIn does not use PKCE here.
    expect(url.searchParams.get('code_challenge')).toBeNull();
    expect(stored[0].codeVerifier).toBeUndefined();
  });

  it('X: requires PKCE (S256)', async () => {
    const { service } = await createService();
    const { authorizationUrl } = await service.initiateOAuth('x', 'u1', 'w1', REDIRECT);
    const url = new URL(authorizationUrl);

    expect(url.searchParams.get('client_id')).toBe('x-id');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });

  it('keeps a static, param-free redirect_uri so it can be registered verbatim', async () => {
    const { service } = await createService();
    const { authorizationUrl } = await service.initiateOAuth('tiktok', 'u1', 'w1', REDIRECT);
    const url = new URL(authorizationUrl);
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
  });
});
