import * as crypto from 'crypto';
import { encryptSecret, decryptSecret, hashToken } from './crypto.util';

/**
 * Tests for the unified AES-256-GCM implementation that replaced six
 * copy-pasted variants (docs/audit-2026-07-20.md §H6).
 *
 * The backwards-compatibility case matters most: one of the replaced copies
 * (packages/utils/encryption.ts) used a 16-byte IV. Any value it wrote must
 * still decrypt, or 2FA secrets and OAuth tokens become unrecoverable.
 */
describe('crypto.util', () => {
  const VALID_KEY = 'a'.repeat(64);
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  describe('round trip', () => {
    it('encrypts and decrypts back to the original value', () => {
      const plaintext = 'ya29.a0AfB_super_secret_oauth_token';
      expect(decryptSecret(encryptSecret(plaintext))).toBe(plaintext);
    });

    it('handles unicode and empty strings', () => {
      for (const value of ['', 'héllo wörld 🎉', 'a'.repeat(5000)]) {
        expect(decryptSecret(encryptSecret(value))).toBe(value);
      }
    });

    it('produces a different ciphertext each time (random IV)', () => {
      const a = encryptSecret('same input');
      const b = encryptSecret('same input');
      expect(a).not.toBe(b);
      expect(decryptSecret(a)).toBe(decryptSecret(b));
    });

    it('emits the standard 12-byte IV for new values', () => {
      const [ivHex] = encryptSecret('x').split(':');
      expect(Buffer.from(ivHex, 'hex')).toHaveLength(12);
    });
  });

  describe('backwards compatibility', () => {
    it('decrypts values written with a 16-byte IV by the old packages/utils copy', () => {
      // Reproduce exactly what the old implementation produced.
      const key = Buffer.from(VALID_KEY, 'hex');
      const iv = crypto.randomBytes(16); // the divergent length
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([
        cipher.update('legacy-oauth-token', 'utf8'),
        cipher.final(),
      ]);
      const legacy = `${iv.toString('hex')}:${cipher
        .getAuthTag()
        .toString('hex')}:${encrypted.toString('hex')}`;

      expect(decryptSecret(legacy)).toBe('legacy-oauth-token');
    });
  });

  describe('tamper detection', () => {
    it('rejects a modified ciphertext (GCM auth tag failure)', () => {
      const [iv, tag, ct] = encryptSecret('sensitive').split(':');
      const flipped = (parseInt(ct[0], 16) ^ 1).toString(16) + ct.slice(1);
      expect(() => decryptSecret(`${iv}:${tag}:${flipped}`)).toThrow();
    });

    it('rejects a modified auth tag', () => {
      const [iv, tag, ct] = encryptSecret('sensitive').split(':');
      const flipped = (parseInt(tag[0], 16) ^ 1).toString(16) + tag.slice(1);
      expect(() => decryptSecret(`${iv}:${flipped}:${ct}`)).toThrow();
    });

    it('rejects a value encrypted under a different key', () => {
      const payload = encryptSecret('sensitive');
      process.env.ENCRYPTION_KEY = 'b'.repeat(64);
      expect(() => decryptSecret(payload)).toThrow();
    });
  });

  describe('malformed input', () => {
    it.each([
      ['no separators', 'notavalidpayload'],
      ['too few segments', 'aabb:ccdd'],
      ['too many segments', 'aa:bb:cc:dd'],
      ['empty IV', ':bb:cc'],
      ['empty auth tag', 'aa::cc'],
    ])('rejects %s', (_label, payload) => {
      expect(() => decryptSecret(payload)).toThrow();
    });
  });

  describe('key validation', () => {
    it('rejects a missing key', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encryptSecret('x')).toThrow(/not set/i);
    });

    it('rejects the all-zero placeholder key', () => {
      process.env.ENCRYPTION_KEY = '0'.repeat(64);
      expect(() => encryptSecret('x')).toThrow(/placeholder/i);
    });

    it('rejects a key of the wrong length', () => {
      process.env.ENCRYPTION_KEY = 'abc123';
      expect(() => encryptSecret('x')).toThrow(/64-character hex/i);
    });

    it('rejects a non-hex key of the right length', () => {
      process.env.ENCRYPTION_KEY = 'z'.repeat(64);
      expect(() => encryptSecret('x')).toThrow(/64-character hex/i);
    });
  });

  describe('hashToken', () => {
    it('is deterministic and 64 hex chars', () => {
      expect(hashToken('token')).toBe(hashToken('token'));
      expect(hashToken('token')).toMatch(/^[a-f0-9]{64}$/);
    });

    it('differs for different inputs', () => {
      expect(hashToken('a')).not.toBe(hashToken('b'));
    });
  });
});
