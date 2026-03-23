import { z } from 'zod';

export const planLimitsSchema = z.object({
  posts_per_month: z.number().int().min(0),
  connected_accounts: z.number().int().min(0),
  analytics_days: z.number().int().min(0),
  team_members: z.number().int().min(1),
  projects: z.number().int().min(0),
  max_scheduled_queue: z.number().int().min(0),
  storage_gb: z.number().min(0),
  ai_credits: z.number().int().min(0),
  rate_limit_per_hour: z.number().int().nullable(),
});

export const planFeaturesSchema = z.object({
  scheduling: z.boolean(),
  platform_previews: z.boolean(),
  mention_tagging: z.boolean(),
  best_time_suggestions: z.boolean(),
  approval_workflows: z.boolean(),
  white_label_reports: z.boolean(),
  bulk_csv_scheduling: z.boolean(),
  client_portal: z.boolean(),
  client_invoicing: z.boolean(),
  webhooks: z.boolean(),
  api_access: z.boolean(),
  custom_bio_domain: z.boolean(),
  white_label_app: z.boolean(),
  sla_guarantee: z.boolean(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500),
  price_monthly_usd: z.number().min(0),
  price_annual_usd: z.number().min(0),
  seat_price_usd: z.number().min(0),
  limits: planLimitsSchema,
  features: planFeaturesSchema,
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
