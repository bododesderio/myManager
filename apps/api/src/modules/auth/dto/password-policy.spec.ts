import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from './register.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';

/**
 * Password policy enforcement (docs/audit-2026-07-20.md).
 *
 * `packages/validators` declared this policy but nothing enforced it: the web
 * app never imported the schema and the DTOs only checked MinLength(8).
 *
 * The reset/change cases matter most. Enforcing the policy on signup alone was
 * trivially bypassable — register with a compliant password, then immediately
 * reset to a weak one. A policy is only as strong as its weakest entry point,
 * so all three are asserted together here.
 */
describe('password policy', () => {
  function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
    const dto = plainToInstance(cls, payload);
    return validateSync(dto as object).flatMap((e) => Object.values(e.constraints ?? {}));
  }

  const VALID = 'Str0ngPassword';

  const weak: Array<[string, string]> = [
    ['no uppercase', 'lowercase123'],
    ['no lowercase', 'UPPERCASE123'],
    ['no number', 'NoNumbersHere'],
    ['too short', 'Ab1'],
  ];

  describe('RegisterDto', () => {
    const base = {
      accountType: 'individual',
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
    };

    it('accepts a compliant password', () => {
      expect(errorsFor(RegisterDto, { ...base, password: VALID })).toHaveLength(0);
    });

    it.each(weak)('rejects a password with %s', (_label, password) => {
      expect(errorsFor(RegisterDto, { ...base, password }).length).toBeGreaterThan(0);
    });
  });

  describe('ResetPasswordDto — the bypass that mattered', () => {
    it('accepts a compliant password', () => {
      expect(errorsFor(ResetPasswordDto, { token: 't', password: VALID })).toHaveLength(0);
    });

    it.each(weak)('rejects a password with %s', (_label, password) => {
      expect(errorsFor(ResetPasswordDto, { token: 't', password }).length).toBeGreaterThan(0);
    });
  });

  describe('ChangePasswordDto', () => {
    it('accepts a compliant password', () => {
      expect(
        errorsFor(ChangePasswordDto, { currentPassword: 'x', newPassword: VALID }),
      ).toHaveLength(0);
    });

    it.each(weak)('rejects a password with %s', (_label, newPassword) => {
      expect(
        errorsFor(ChangePasswordDto, { currentPassword: 'x', newPassword }).length,
      ).toBeGreaterThan(0);
    });
  });

  it('applies the same rules at every entry point', () => {
    // Guards against one DTO drifting from the others — the exact failure mode
    // that left reset-password weak while signup was strong.
    const weakPassword = 'lowercase123';
    expect(errorsFor(RegisterDto, {
      accountType: 'individual', firstName: 'A', lastName: 'B',
      email: 'a@example.com', password: weakPassword,
    }).length).toBeGreaterThan(0);
    expect(errorsFor(ResetPasswordDto, { token: 't', password: weakPassword }).length)
      .toBeGreaterThan(0);
    expect(errorsFor(ChangePasswordDto, { currentPassword: 'x', newPassword: weakPassword }).length)
      .toBeGreaterThan(0);
  });
});
