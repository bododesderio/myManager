import { z } from 'zod';

/**
 * Boot-time environment validation (docs/audit-2026-07-20.md §M9).
 *
 * Previously main.ts only checked that four keys were non-empty. Nothing
 * validated their *shape*, so a malformed ENCRYPTION_KEY booted cleanly and then
 * failed at the first decrypt — inside a background worker, hours later, on a
 * customer's OAuth token. Config errors should be loud, immediate, and at
 * startup.
 */

const hex64 = z
  .string()
  .length(64, 'must be exactly 64 hex characters (32 bytes)')
  .regex(/^[0-9a-fA-F]+$/, 'must contain only hex characters')
  .refine((v) => v !== '0'.repeat(64), 'must not be the all-zero placeholder');

export const envSchema = z.object({
  // --- Required ---
  DATABASE_URL: z.string().url('must be a valid connection URL'),
  REDIS_URL: z.string().url('must be a valid connection URL'),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ENCRYPTION_KEY: hex64,

  // --- Optional, but validated when present ---
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  METRICS_TOKEN: z.string().optional(),
})
  // Billing is all-or-nothing: a secret key without a webhook secret means
  // payments are accepted but their callbacks cannot be trusted.
  .refine(
    (env) => !env.FLUTTERWAVE_SECRET_KEY || !!env.FLUTTERWAVE_WEBHOOK_SECRET,
    {
      message:
        'FLUTTERWAVE_WEBHOOK_SECRET is required when FLUTTERWAVE_SECRET_KEY is set',
      path: ['FLUTTERWAVE_WEBHOOK_SECRET'],
    },
  );

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validate process.env, throwing a single readable error listing every problem
 * at once rather than failing on the first.
 */
export function validateEnv(source: NodeJS.ProcessEnv = process.env): ValidatedEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  return result.data;
}
