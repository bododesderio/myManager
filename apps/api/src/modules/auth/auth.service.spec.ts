import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

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
