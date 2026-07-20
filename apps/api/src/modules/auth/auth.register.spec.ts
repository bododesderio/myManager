import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Registration had no test coverage at all before Phase 1
 * (docs/audit-2026-07-20.md §H8), which is why it was possible for it to be
 * five non-atomic writes without anyone noticing.
 *
 * These tests pin the contract that matters: account creation is
 * all-or-nothing, and a partial failure must not leave a half-built account.
 */
describe('AuthService.register', () => {
  function createService(overrides: Record<string, jest.Mock> = {}) {
    const createdUser = {
      id: 'user_1',
      email: 'new@example.com',
      name: 'New User',
      is_superadmin: false,
      email_verified: false,
    };

    const repository = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
      findUserById: jest.fn().mockResolvedValue(createdUser),
      createUserWithWorkspace: jest.fn().mockResolvedValue({
        user: createdUser,
        workspace: { id: 'ws_1', name: "New User's Workspace" },
      }),
      enqueueEmail: jest.fn().mockResolvedValue(undefined),
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      // Legacy per-step methods must NOT be used by register any more.
      createUser: jest.fn(),
      createDefaultWorkspace: jest.fn(),
      createWorkspaceMember: jest.fn(),
      createUserPreferences: jest.fn(),
      assignPlanToWorkspace: jest.fn(),
      storeEmailVerificationToken: jest.fn(),
      ...overrides,
    };

    const jwtService = { sign: jest.fn().mockReturnValue('signed-access-token') };
    const configService = {
      get: jest.fn().mockImplementation((key: string, fallback?: string) => {
        if (key === 'ENCRYPTION_KEY') {
          return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        }
        if (key === 'WEB_URL') return 'http://localhost:3000';
        return fallback;
      }),
    };

    const service = new AuthService(
      repository as any,
      jwtService as any,
      configService as any,
    );
    return { service, repository };
  }

  const validInput = {
    email: 'new@example.com',
    password: 'password123',
    firstName: 'New',
    lastName: 'User',
    accountType: 'individual' as const,
  };

  it('creates the account through a single atomic call', async () => {
    const { service, repository } = createService();

    const result = await service.register(validInput as any);

    expect(repository.createUserWithWorkspace).toHaveBeenCalledTimes(1);
    expect(result.workspaceId).toBe('ws_1');

    // The old non-atomic path must be gone: a partial failure across these
    // separate calls was what left users owning nothing.
    expect(repository.createUser).not.toHaveBeenCalled();
    expect(repository.createDefaultWorkspace).not.toHaveBeenCalled();
    expect(repository.createWorkspaceMember).not.toHaveBeenCalled();
    expect(repository.createUserPreferences).not.toHaveBeenCalled();
    expect(repository.storeEmailVerificationToken).not.toHaveBeenCalled();
  });

  it('passes the verification token hash into the transaction, not a raw token', async () => {
    const { service, repository } = createService();

    await service.register(validInput as any);

    const arg = repository.createUserWithWorkspace.mock.calls[0][0];
    // sha256 hex digest
    expect(arg.emailVerificationTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(arg.emailVerificationExpiresAt).toBeInstanceOf(Date);
    expect(arg.emailVerificationExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('does not send a verification email if the transaction fails', async () => {
    const { service, repository } = createService({
      createUserWithWorkspace: jest.fn().mockRejectedValue(new Error('db down')),
    });

    await expect(service.register(validInput as any)).rejects.toThrow('db down');

    // No email for an account that does not exist.
    expect(repository.enqueueEmail).not.toHaveBeenCalled();
    expect(repository.storeRefreshToken).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email before attempting any writes', async () => {
    const { service, repository } = createService({
      findUserByEmail: jest.fn().mockResolvedValue({ id: 'existing' }),
    });

    await expect(service.register(validInput as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.createUserWithWorkspace).not.toHaveBeenCalled();
  });

  it('forwards the selected plan and billing cycle into the transaction', async () => {
    const { service, repository } = createService();

    await service.register({
      ...validInput,
      planSlug: 'pro',
      billingCycle: 'annual',
    } as any);

    const arg = repository.createUserWithWorkspace.mock.calls[0][0];
    expect(arg.planSlug).toBe('pro');
    expect(arg.billingCycle).toBe('annual');
  });

  it('derives a url-safe workspace slug for company accounts', async () => {
    const { service, repository } = createService();

    await service.register({
      ...validInput,
      accountType: 'company',
      companyName: 'Acme & Co. Ltd',
    } as any);

    const arg = repository.createUserWithWorkspace.mock.calls[0][0];
    expect(arg.workspaceSlug).toMatch(/^[a-z0-9-]+$/);
    expect(arg.workspaceSlug).not.toMatch(/(^-|-$)/);
  });
});
