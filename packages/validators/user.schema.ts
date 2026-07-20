import { z } from 'zod';

/**
 * The password policy, defined once.
 *
 * Mirrors PASSWORD_RULES in apps/api/src/modules/auth/dto/register.dto.ts.
 * The API uses class-validator and this package uses Zod, so the two cannot
 * share an implementation without pulling Zod into every DTO — they are kept in
 * sync by hand and both sides say so. Change them together.
 *
 * Exported separately so forms can describe the rules to the user BEFORE submit
 * rather than relying on a round-trip. apps/web previously shipped its own
 * strength meter that checked for a symbol and did NOT check for a lowercase
 * letter, so "PASSWORD1" scored well and was then rejected by the server.
 */
export const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'One uppercase letter' },
  { test: (v: string) => /[a-z]/.test(v), label: 'One lowercase letter' },
  { test: (v: string) => /[0-9]/.test(v), label: 'One number' },
] as const;

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * The authoritative "is this password acceptable" check.
 *
 * Delegates to passwordSchema rather than re-evaluating PASSWORD_RULES, because
 * the schema also caps length at 128 and the rules list does not — a 200-char
 * password satisfied all four displayed rules while the schema rejected it.
 * PASSWORD_RULES exists to TELL the user what is required; this decides.
 */
export function passwordMeetsPolicy(value: string): boolean {
  return passwordSchema.safeParse(value).success;
}

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: passwordSchema,
});

/**
 * Mirrors RegisterDto in the API, field for field, so the client can reject
 * what the server would reject — and, just as importantly, accept everything
 * the server accepts. Client validation that is STRICTER than the server blocks
 * legitimate input, which is worse than no client validation at all.
 */
export const registerSchema = z.object({
  accountType: z.enum(['individual', 'company']),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
  country: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  workspaceName: z.string().max(200).optional(),
  workspaceSlug: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  teamSize: z.string().max(50).optional(),
  referralSource: z.string().max(200).optional(),
  planSlug: z.string().optional(),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp_code: z.string().length(6).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  timezone: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  language: z.enum(['en', 'fr', 'sw', 'ar', 'es', 'pt']).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
