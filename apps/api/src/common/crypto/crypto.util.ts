import * as crypto from 'crypto';

/**
 * The single AES-256-GCM implementation for the API.
 *
 * Before Phase 1 this logic was copy-pasted into six files
 * (docs/audit-2026-07-20.md §H6), spanning two trust domains — OAuth access
 * tokens AND TOTP 2FA secrets. A crypto fix applied to one copy stayed broken in
 * the other five, and the copies had already diverged (one used a 16-byte IV
 * where the rest used 12).
 *
 * Wire format is unchanged: `ivHex:authTagHex:ciphertextHex`.
 *
 * COMPATIBILITY: decrypt() reads the IV length from the payload itself, so
 * values written by any previous copy — including the 16-byte-IV variant in
 * packages/utils — still decrypt. New values always use the standard 12-byte IV.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // GCM standard
const KEY_HEX_LENGTH = 64; // 32 bytes
const PLACEHOLDER_KEY = '0'.repeat(64);

/**
 * Resolve and validate the encryption key.
 *
 * Validated on every call rather than cached at module load so that a malformed
 * key surfaces as a clear error rather than a confusing failure deep inside a
 * cipher call. The work is negligible next to the cipher itself.
 */
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set');
  }
  if (key === PLACEHOLDER_KEY) {
    throw new Error('ENCRYPTION_KEY is still the all-zero placeholder value');
  }
  if (key.length !== KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      `ENCRYPTION_KEY must be a ${KEY_HEX_LENGTH}-character hex string (got ${key.length} chars)`,
    );
  }

  return Buffer.from(key, 'hex');
}

/** Encrypt a UTF-8 string. Returns `ivHex:authTagHex:ciphertextHex`. */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a value produced by encryptSecret().
 *
 * Throws if the payload is malformed or the auth tag does not verify — GCM
 * authentication failure means the ciphertext was tampered with, so it must
 * never be swallowed.
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format (expected iv:authTag:ciphertext)');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  // cipherHex may legitimately be empty (empty plaintext encrypts to zero
  // bytes); the IV and auth tag never can be.
  if (!ivHex || !authTagHex) {
    throw new Error('Invalid encrypted payload: missing IV or auth tag');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex'), // length taken from the payload, not assumed
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** SHA-256 hex digest, for values compared but never recovered (tokens). */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
