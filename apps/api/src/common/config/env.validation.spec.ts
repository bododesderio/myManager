import { validateEnv } from './env.validation';

/**
 * Boot-time config validation (docs/audit-2026-07-20.md §M9).
 * The ENCRYPTION_KEY cases are the point of this file: a malformed key used to
 * boot cleanly and fail later inside a worker, mid-decrypt.
 */
describe('validateEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'x'.repeat(32),
    ENCRYPTION_KEY: 'a'.repeat(64),
  };

  it('accepts a valid minimal environment', () => {
    const parsed = validateEnv(valid as NodeJS.ProcessEnv);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe(3001);
  });

  it('coerces PORT to a number', () => {
    const parsed = validateEnv({ ...valid, PORT: '8080' } as NodeJS.ProcessEnv);
    expect(parsed.PORT).toBe(8080);
  });

  describe('ENCRYPTION_KEY', () => {
    it.each([
      ['too short', 'abc'],
      ['non-hex characters', 'z'.repeat(64)],
      ['all-zero placeholder', '0'.repeat(64)],
    ])('rejects %s', (_label, key) => {
      expect(() =>
        validateEnv({ ...valid, ENCRYPTION_KEY: key } as NodeJS.ProcessEnv),
      ).toThrow(/ENCRYPTION_KEY/);
    });
  });

  it('rejects a JWT_SECRET below 32 characters', () => {
    expect(() =>
      validateEnv({ ...valid, JWT_SECRET: 'short' } as NodeJS.ProcessEnv),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects a malformed DATABASE_URL', () => {
    expect(() =>
      validateEnv({ ...valid, DATABASE_URL: 'not-a-url' } as NodeJS.ProcessEnv),
    ).toThrow(/DATABASE_URL/);
  });

  it('reports every problem at once rather than only the first', () => {
    let message = '';
    try {
      validateEnv({ JWT_SECRET: 'short', ENCRYPTION_KEY: 'bad' } as NodeJS.ProcessEnv);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('DATABASE_URL');
    expect(message).toContain('REDIS_URL');
    expect(message).toContain('JWT_SECRET');
    expect(message).toContain('ENCRYPTION_KEY');
  });

  it('requires a webhook secret whenever billing is enabled', () => {
    expect(() =>
      validateEnv({
        ...valid,
        FLUTTERWAVE_SECRET_KEY: 'FLWSECK_TEST-xxx',
      } as NodeJS.ProcessEnv),
    ).toThrow(/FLUTTERWAVE_WEBHOOK_SECRET/);
  });

  it('allows billing vars to be absent together', () => {
    expect(() => validateEnv(valid as NodeJS.ProcessEnv)).not.toThrow();
  });
});
