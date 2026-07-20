import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { passwordSchema, passwordMeetsPolicy, PASSWORD_RULES } from '@mymanager/validators';
import { RegisterDto } from './register.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';

/**
 * Parity between the two password-policy implementations.
 *
 * The API validates with class-validator; apps/web validates with the Zod schema
 * in @mymanager/validators. They cannot share an implementation without pulling
 * Zod into every DTO, so they are maintained by hand — and hand-maintained
 * duplicates drift. This test is what makes the duplication safe.
 *
 * The asymmetry that matters: client validation being STRICTER than the server
 * is worse than having none, because it blocks input the server would happily
 * accept and the user has no way to discover why.
 */
describe('password policy parity: Zod schema vs class-validator DTOs', () => {
  const serverAccepts = (password: string) => {
    const dto = plainToInstance(RegisterDto, {
      accountType: 'individual',
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
      password,
    });
    return validateSync(dto as object).length === 0;
  };

  const clientAccepts = (password: string) => passwordSchema.safeParse(password).success;

  const CASES = [
    // valid
    'Str0ngPassword',
    'Aa1aaaaa',
    'ZZZZzzzz9',
    'P4ssword!@#',
    'A'.repeat(60) + 'a1',
    // invalid — one rule broken at a time
    'lowercase123',        // no uppercase
    'UPPERCASE123',        // no lowercase
    'NoNumbersHere',       // no digit
    'Ab1',                 // too short
    '',                    // empty
    'ALLUPPERCASE',        // no lowercase, no digit
    '12345678',            // digits only
    'a'.repeat(200) + 'A1',// too long
  ];

  it.each(CASES)('agrees on %p', (password) => {
    expect(clientAccepts(password)).toBe(serverAccepts(password));
  });

  it('PASSWORD_RULES agrees with the schema it documents', () => {
    // The rules list drives the signup UI checklist. If it disagreed with the
    // schema, the UI would show all rules met on a password the form rejects.
    for (const password of CASES) {
      expect(passwordMeetsPolicy(password)).toBe(clientAccepts(password));
    }
  });

  it('applies to reset and change, not just registration', () => {
    const weak = 'lowercase123';
    const strong = 'Str0ngPassword';

    const reset = (p: string) =>
      validateSync(plainToInstance(ResetPasswordDto, { token: 't', password: p }) as object).length === 0;
    const change = (p: string) =>
      validateSync(plainToInstance(ChangePasswordDto, { currentPassword: 'x', newPassword: p }) as object).length === 0;

    expect(reset(weak)).toBe(false);
    expect(change(weak)).toBe(false);
    expect(reset(strong)).toBe(true);
    expect(change(strong)).toBe(true);
    // and all three entry points agree with the client
    expect(clientAccepts(weak)).toBe(false);
    expect(clientAccepts(strong)).toBe(true);
  });

  it('exposes exactly the rules the UI renders', () => {
    expect(PASSWORD_RULES.map((r) => r.label)).toEqual([
      'At least 8 characters',
      'One uppercase letter',
      'One lowercase letter',
      'One number',
    ]);
  });
});
