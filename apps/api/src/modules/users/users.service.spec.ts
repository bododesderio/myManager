import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  function createService() {
    const repository = {
      findPreferences: jest.fn(),
      findAllUsers: jest.fn(),
      findById: jest.fn(),
      findByIdWithDetails: jest.fn(),
      updateUser: jest.fn(),
      disableTwoFactor: jest.fn(),
    };

    const configService = {
      get: jest.fn().mockReturnValue('redis://localhost:6379'),
    };

    return {
      service: new UsersService(
        repository as unknown as ConstructorParameters<typeof UsersService>[0],
        configService as unknown as ConstructorParameters<typeof UsersService>[1],
      ),
      repository,
    };
  }

  it('removes the encrypted TOTP secret from preferences responses', async () => {
    const { service, repository } = createService();
    repository.findPreferences.mockResolvedValue({
      language: 'en',
      currency: 'USD',
      totp_enabled: true,
      totp_secret: 'encrypted-secret',
    });

    await expect(service.getPreferences('user_1')).resolves.toEqual({
      language: 'en',
      currency: 'USD',
      totp_enabled: true,
    });
  });

  it('disables 2FA for a user when a secret exists', async () => {
    const { service, repository } = createService();
    repository.findByIdWithDetails.mockResolvedValue({
      id: 'user_1',
      preferences: { totp_enabled: true, totp_secret: 'encrypted-secret' },
    });

    await expect(service.disableUserTwoFactor('user_1')).resolves.toEqual({ disabled: true });
    expect(repository.disableTwoFactor).toHaveBeenCalledWith('user_1');
  });

  it('rejects disabling 2FA for a missing user', async () => {
    const { service, repository } = createService();
    repository.findByIdWithDetails.mockResolvedValue(null);

    await expect(service.disableUserTwoFactor('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
