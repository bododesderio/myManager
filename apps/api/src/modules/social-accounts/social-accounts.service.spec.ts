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
    PINTEREST_APP_ID: 'pin-id',
    PINTEREST_APP_SECRET: 'pin-secret',
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

  it('Pinterest: uses client_id, v5 scopes, and no PKCE', async () => {
    const { service, stored } = await createService();
    const { authorizationUrl } = await service.initiateOAuth('pinterest', 'u1', 'w1', REDIRECT);
    const url = new URL(authorizationUrl);

    expect(url.origin + url.pathname).toBe('https://www.pinterest.com/oauth/');
    expect(url.searchParams.get('client_id')).toBe('pin-id');
    expect(url.searchParams.get('scope')).toBe('boards:read pins:read pins:write');
    // Pinterest v5 does not use PKCE.
    expect(url.searchParams.get('code_challenge')).toBeNull();
    expect(stored[0].codeVerifier).toBeUndefined();
  });

  it('keeps a static, param-free redirect_uri so it can be registered verbatim', async () => {
    const { service } = await createService();
    const { authorizationUrl } = await service.initiateOAuth('tiktok', 'u1', 'w1', REDIRECT);
    const url = new URL(authorizationUrl);
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
  });
});

/**
 * Pinterest v5 and X mandate HTTP Basic auth on the token endpoint and reject
 * client_secret in the body. Locks in that the callback sends the credentials
 * as an Authorization header, not a body field.
 */
describe('SocialAccountsService.handleOAuthCallback — Basic-auth token exchange', () => {
  const ENV: Record<string, string> = {
    PINTEREST_APP_ID: 'pin-id',
    PINTEREST_APP_SECRET: 'pin-secret',
  };
  const REDIRECT = 'http://localhost:3000/connect/oauth';

  beforeAll(() => {
    // encryptSecret validates a 64-hex-char key at call time.
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('Pinterest: sends Basic auth and keeps client_secret out of the body', async () => {
    const repository = {
      getOAuthState: jest.fn().mockResolvedValue({
        platform: 'pinterest',
        userId: 'u1',
        workspaceId: 'w1',
        redirectUri: REDIRECT,
      }),
      upsert: jest.fn().mockResolvedValue({ id: 'acc1' }),
      deleteOAuthState: jest.fn().mockResolvedValue(undefined),
    };
    const configService = { get: (k: string) => ENV[k] };
    const service = new SocialAccountsService(
      repository as unknown as ConstructorParameters<typeof SocialAccountsService>[0],
      configService as unknown as ConstructorParameters<typeof SocialAccountsService>[1],
    );

    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const body = url.includes('/oauth/token')
        ? { access_token: 'pin-access', refresh_token: 'pin-refresh', expires_in: 3600 }
        : { username: 'acmepins', profile_image: 'https://p/img.png' };
      return { json: async () => body } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await service.handleOAuthCallback('the-code', 'the-state', 'w1', 'pinterest');

    const tokenCall = calls.find((c) => c.url === 'https://api.pinterest.com/v5/oauth/token');
    expect(tokenCall).toBeDefined();
    const headers = tokenCall!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      'Basic ' + Buffer.from('pin-id:pin-secret').toString('base64'),
    );
    // Secret must NOT appear in the form body.
    expect(String(tokenCall!.init.body)).not.toContain('client_secret');
    expect(String(tokenCall!.init.body)).not.toContain('pin-secret');

    // Username seeds platform_user_id (Pinterest exposes no numeric id).
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ platform_user_id: 'acmepins' }),
    );
  });
});
