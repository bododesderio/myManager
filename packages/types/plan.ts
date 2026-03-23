export interface PlanLimits {
  posts_per_month: number;
  connected_accounts: number;
  analytics_days: number;
  team_members: number;
  projects: number;
  max_scheduled_queue: number;
  storage_gb: number;
  ai_credits: number;
  rate_limit_per_hour: number | null;
}

export interface PlanFeatures {
  scheduling: boolean;
  platform_previews: boolean;
  mention_tagging: boolean;
  best_time_suggestions: boolean;
  approval_workflows: boolean;
  white_label_reports: boolean;
  bulk_csv_scheduling: boolean;
  client_portal: boolean;
  client_invoicing: boolean;
  webhooks: boolean;
  api_access: boolean;
  custom_bio_domain: boolean;
  white_label_app: boolean;
  sla_guarantee: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly_usd: number;
  price_annual_usd: number;
  seat_price_usd: number;
  limits: PlanLimits;
  features: PlanFeatures;
  is_active: boolean;
  is_custom: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  workspace_id: string;
  plan_id: string;
  plan: Plan;
  flutterwave_subscription_id: string | null;
  status: SubscriptionStatus;
  billing_interval: 'monthly' | 'annual';
  billing_currency: string;
  billing_amount: number;
  locked_limits: PlanLimits;
  locked_features: PlanFeatures;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'trialing';
