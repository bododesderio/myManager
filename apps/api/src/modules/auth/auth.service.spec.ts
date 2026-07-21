import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { getSharedRedis } from '../../common/redis/shared-redis';

jest.mock('../../common/redis/shared-redis', () => ({
  getSharedRedis: jest.fn(),
}));

describe('AuthService.login', () => {
  function createService() {
    const baseUser = {
      id: 'user_1',
      email: 'user@example.com',
      name: 'Test User',
      password_hash: bcrypt.hashSync('password', 4),
      is_superadmin: false,
      email_verified: true,
      preferences: {
        totp_enabled: true,
        totp_secret: 'encrypted-secret',
      },
    };

    const repository = {
      findUserByEmail: jest.fn().mockResolvedValue(baseUser),
      findUserById: jest.fn().mockResolvedValue(baseUser),
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-access-token'),
    };
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'ENCRYPTION_KEY') {
          return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        }
        return undefined;
      }),
    };

    const service = new AuthService(repository as unknown as ConstructorParameters<typeof AuthService>[0], jwtService as unknown as ConstructorParameters<typeof AuthService>[1], configService as unknown as ConstructorParameters<typeof AuthService>[2]);
    return { service, repository, jwtService };
  }

  it('returns a 2FA challenge when the code is missing', async () => {
    const { service } = createService();

    const result = await service.login('user@example.com', 'password');

    expect(result.accessToken).toBe('');
    expect(result.refreshToken).toBe('');
    expect(result.user).toEqual({ requiresTwoFactor: true, userId: 'user_1' });
  });

  it('signs the user in when a valid TOTP code is provided', async () => {
    const { service, repository, jwtService } = createService();
    jest.spyOn(service as any, 'decryptTotpSecret').mockReturnValue('totp-secret');
    jest.spyOn(service as any, 'verifyTotpCode').mockReturnValue(true);

    const result = await service.login('user@example.com', 'password', '123456');

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toHaveLength(80);
    expect(result.user.email).toBe('user@example.com');
    expect(repository.storeRefreshToken).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('rejects an invalid TOTP code', async () => {
    const { service } = createService();
    jest.spyOn(service as any, 'decryptTotpSecret').mockReturnValue('totp-secret');
    jest.spyOn(service as any, 'verifyTotpCode').mockReturnValue(false);

    await expect(service.login('user@example.com', 'password', '000000')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('AuthService.refreshTokens — rotation & reuse detection', () => {
  function makeService(repoOverrides: Record<string, any> = {}) {
    const repository = {
      consumeRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn().mockResolvedValue({ count: 1 }),
      revokeAllRefreshTokensForUser: jest.fn().mockResolvedValue({ count: 1 }),
      findUserById: jest.fn().mockResolvedValue({ id: 'u1', email: 'a@b.com', is_superadmin: false }),
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      ...repoOverrides,
    };
    const jwtService = { sign: jest.fn().mockReturnValue('signed.jwt') };
    const configService = { get: jest.fn() };
    const service = new AuthService(
      repository as unknown as ConstructorParameters<typeof AuthService>[0],
      jwtService as unknown as ConstructorParameters<typeof AuthService>[1],
      configService as unknown as ConstructorParameters<typeof AuthService>[2],
    );
    return { service, repository, jwtService };
  }

  it('rotates a valid token into a fresh access + refresh pair', async () => {
    const { service, repository } = makeService({
      consumeRefreshToken: jest.fn().mockResolvedValue({ status: 'rotated', userId: 'u1' }),
    });

    const result = await service.refreshTokens('valid-token');

    expect(result.accessToken).toBe('signed.jwt');
    expect(result.refreshToken).toHaveLength(80);
    expect(repository.storeRefreshToken).toHaveBeenCalledTimes(1);
    expect(repository.revokeAllRefreshTokensForUser).not.toHaveBeenCalled();
  });

  it('revokes the whole family and 401s when a used/revoked token is replayed', async () => {
    const { service, repository } = makeService({
      consumeRefreshToken: jest.fn().mockResolvedValue({ status: 'reuse', userId: 'u1' }),
    });

    await expect(service.refreshTokens('stolen-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('u1');
    expect(repository.storeRefreshToken).not.toHaveBeenCalled();
  });

  it('401s an invalid/expired token without revoking the family', async () => {
    const { service, repository } = makeService({
      consumeRefreshToken: jest.fn().mockResolvedValue({ status: 'invalid' }),
    });

    await expect(service.refreshTokens('nope')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.revokeAllRefreshTokensForUser).not.toHaveBeenCalled();
    expect(repository.storeRefreshToken).not.toHaveBeenCalled();
  });

  it('looks the token up by SHA-256 hash, never by its raw value', async () => {
    const consumeRefreshToken = jest.fn().mockResolvedValue({ status: 'invalid' });
    const { service } = makeService({ consumeRefreshToken });

    await expect(service.refreshTokens('raw-secret')).rejects.toBeInstanceOf(UnauthorizedException);

    const passedHash = consumeRefreshToken.mock.calls[0][0];
    expect(passedHash).not.toContain('raw-secret');
    expect(passedHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('revokeRefreshToken (logout) revokes by hash rather than deleting', async () => {
    const { service, repository } = makeService();

    await service.revokeRefreshToken('some-token');

    expect(repository.revokeRefreshToken).toHaveBeenCalledTimes(1);
    expect(repository.revokeRefreshToken.mock.calls[0][0]).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('AuthService.verifyTotpCode — replay guard & constant-time', () => {
  const secret = '3132333435363738393031323334353637383930'; // valid hex

  function totpFor(counter: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const hash = crypto.createHmac('sha1', Buffer.from(secret, 'hex')).update(buffer).digest();
    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    return (binary % 1_000_000).toString().padStart(6, '0');
  }
  const currentCode = () => totpFor(Math.floor(Date.now() / 1000 / 30));

  function makeService(redisSet: jest.Mock) {
    (getSharedRedis as jest.Mock).mockReturnValue({ set: redisSet });
    return new AuthService({} as any, {} as any, { get: jest.fn() } as any);
  }

  const call = (s: AuthService, code: string) =>
    (s as any).verifyTotpCode('u1', secret, code) as Promise<boolean>;

  it('accepts a valid code once, then rejects the replay', async () => {
    const set = jest.fn().mockResolvedValueOnce('OK').mockResolvedValueOnce(null);
    const service = makeService(set);
    const code = currentCode();

    await expect(call(service, code)).resolves.toBe(true);
    await expect(call(service, code)).resolves.toBe(false); // replay
    expect(set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:totp_used:u1:\d+$/),
      '1',
      'EX',
      expect.any(Number),
      'NX',
    );
  });

  it('rejects a malformed code without touching Redis', async () => {
    const set = jest.fn();
    const service = makeService(set);

    await expect(call(service, '12345')).resolves.toBe(false); // too short
    await expect(call(service, 'abcdef')).resolves.toBe(false); // non-digit
    expect(set).not.toHaveBeenCalled();
  });

  it('rejects an incorrect 6-digit code', async () => {
    const set = jest.fn().mockResolvedValue('OK');
    const service = makeService(set);
    const wrong = ((Number(currentCode()) + 1) % 1_000_000).toString().padStart(6, '0');

    await expect(call(service, wrong)).resolves.toBe(false);
  });
});
