-- ============================================================================
-- Row-Level Security (RLS) for Multi-Tenant Workspace Isolation
-- ============================================================================
-- This migration enables PostgreSQL RLS on all tables that contain a
-- workspace_id column. Policies restrict row access to the workspace
-- identified by the session variable `app.current_workspace_id`.
--
-- The application MUST call:
--   SET LOCAL app.current_workspace_id = '<uuid>';
-- inside every transaction before issuing queries against these tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create application role (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mymanager_app') THEN
    CREATE ROLE mymanager_app NOLOGIN;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS and create policies on all workspace-scoped tables
-- ---------------------------------------------------------------------------

-- Helper: For each table we:
--   a) Enable RLS
--   b) Create an isolation policy using current_setting (returns NULL when unset)
--   c) Create a bypass policy for the table owner so Prisma migrations work
--      (FORCE ROW LEVEL SECURITY is NOT enabled, so the table owner already
--       bypasses RLS. We add an explicit owner bypass policy for clarity.)

-- ── subscriptions ──────────────────────────────────────────────────────────
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_subscriptions ON "subscriptions"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_subscriptions ON "subscriptions"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'subscriptions' AND schemaname = 'public'));

-- ── billing_history ────────────────────────────────────────────────────────
ALTER TABLE "billing_history" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_billing_history ON "billing_history"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_billing_history ON "billing_history"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'billing_history' AND schemaname = 'public'));

-- ── workspace_members ──────────────────────────────────────────────────────
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_workspace_members ON "workspace_members"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_workspace_members ON "workspace_members"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'workspace_members' AND schemaname = 'public'));

-- ── workspace_invitations ──────────────────────────────────────────────────
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_workspace_invitations ON "workspace_invitations"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_workspace_invitations ON "workspace_invitations"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'workspace_invitations' AND schemaname = 'public'));

-- ── workspace_approval_configs ─────────────────────────────────────────────
ALTER TABLE "workspace_approval_configs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_workspace_approval_configs ON "workspace_approval_configs"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_workspace_approval_configs ON "workspace_approval_configs"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'workspace_approval_configs' AND schemaname = 'public'));

-- ── workspace_brand_configs ────────────────────────────────────────────────
ALTER TABLE "workspace_brand_configs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_workspace_brand_configs ON "workspace_brand_configs"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_workspace_brand_configs ON "workspace_brand_configs"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'workspace_brand_configs' AND schemaname = 'public'));

-- ── projects ───────────────────────────────────────────────────────────────
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_projects ON "projects"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_projects ON "projects"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'projects' AND schemaname = 'public'));

-- ── social_accounts ────────────────────────────────────────────────────────
ALTER TABLE "social_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_social_accounts ON "social_accounts"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_social_accounts ON "social_accounts"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'social_accounts' AND schemaname = 'public'));

-- ── platform_board_cache ───────────────────────────────────────────────────
ALTER TABLE "platform_board_cache" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_platform_board_cache ON "platform_board_cache"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_platform_board_cache ON "platform_board_cache"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'platform_board_cache' AND schemaname = 'public'));

-- ── whatsapp_contact_lists ─────────────────────────────────────────────────
ALTER TABLE "whatsapp_contact_lists" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_whatsapp_contact_lists ON "whatsapp_contact_lists"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_whatsapp_contact_lists ON "whatsapp_contact_lists"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'whatsapp_contact_lists' AND schemaname = 'public'));

-- ── posts ──────────────────────────────────────────────────────────────────
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_posts ON "posts"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_posts ON "posts"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'posts' AND schemaname = 'public'));

-- ── hashtags ───────────────────────────────────────────────────────────────
ALTER TABLE "hashtags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_hashtags ON "hashtags"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_hashtags ON "hashtags"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'hashtags' AND schemaname = 'public'));

-- ── post_templates ─────────────────────────────────────────────────────────
ALTER TABLE "post_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_post_templates ON "post_templates"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_post_templates ON "post_templates"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'post_templates' AND schemaname = 'public'));

-- ── campaigns ──────────────────────────────────────────────────────────────
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_campaigns ON "campaigns"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_campaigns ON "campaigns"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'campaigns' AND schemaname = 'public'));

-- ── media_assets ───────────────────────────────────────────────────────────
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_media_assets ON "media_assets"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_media_assets ON "media_assets"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'media_assets' AND schemaname = 'public'));

-- ── workspace_analytics_daily ──────────────────────────────────────────────
ALTER TABLE "workspace_analytics_daily" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_workspace_analytics_daily ON "workspace_analytics_daily"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_workspace_analytics_daily ON "workspace_analytics_daily"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'workspace_analytics_daily' AND schemaname = 'public'));

-- ── best_times ─────────────────────────────────────────────────────────────
ALTER TABLE "best_times" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_best_times ON "best_times"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_best_times ON "best_times"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'best_times' AND schemaname = 'public'));

-- ── hashtag_sets ───────────────────────────────────────────────────────────
ALTER TABLE "hashtag_sets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_hashtag_sets ON "hashtag_sets"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_hashtag_sets ON "hashtag_sets"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'hashtag_sets' AND schemaname = 'public'));

-- ── notifications ──────────────────────────────────────────────────────────
-- NOTE: workspace_id is nullable on this table. The policy allows rows where
-- workspace_id IS NULL (system-wide notifications) OR matches the session var.
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_notifications ON "notifications"
  USING (
    "workspace_id" IS NULL
    OR "workspace_id"::text = current_setting('app.current_workspace_id', true)
  )
  WITH CHECK (
    "workspace_id" IS NULL
    OR "workspace_id"::text = current_setting('app.current_workspace_id', true)
  );

CREATE POLICY owner_bypass_notifications ON "notifications"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'notifications' AND schemaname = 'public'));

-- ── reports ────────────────────────────────────────────────────────────────
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_reports ON "reports"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_reports ON "reports"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'reports' AND schemaname = 'public'));

-- ── report_configs ─────────────────────────────────────────────────────────
ALTER TABLE "report_configs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_report_configs ON "report_configs"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_report_configs ON "report_configs"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'report_configs' AND schemaname = 'public'));

-- ── ai_credit_usage ────────────────────────────────────────────────────────
-- NOTE: workspace_id is nullable on this table.
ALTER TABLE "ai_credit_usage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_ai_credit_usage ON "ai_credit_usage"
  USING (
    "workspace_id" IS NULL
    OR "workspace_id"::text = current_setting('app.current_workspace_id', true)
  )
  WITH CHECK (
    "workspace_id" IS NULL
    OR "workspace_id"::text = current_setting('app.current_workspace_id', true)
  );

CREATE POLICY owner_bypass_ai_credit_usage ON "ai_credit_usage"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'ai_credit_usage' AND schemaname = 'public'));

-- ── utm_configs ────────────────────────────────────────────────────────────
ALTER TABLE "utm_configs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_utm_configs ON "utm_configs"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_utm_configs ON "utm_configs"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'utm_configs' AND schemaname = 'public'));

-- ── social_comments ────────────────────────────────────────────────────────
ALTER TABLE "social_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_social_comments ON "social_comments"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_social_comments ON "social_comments"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'social_comments' AND schemaname = 'public'));

-- ── bio_pages ──────────────────────────────────────────────────────────────
ALTER TABLE "bio_pages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_bio_pages ON "bio_pages"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_bio_pages ON "bio_pages"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'bio_pages' AND schemaname = 'public'));

-- ── rss_feeds ──────────────────────────────────────────────────────────────
ALTER TABLE "rss_feeds" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_rss_feeds ON "rss_feeds"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_rss_feeds ON "rss_feeds"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'rss_feeds' AND schemaname = 'public'));

-- ── listening_terms ────────────────────────────────────────────────────────
ALTER TABLE "listening_terms" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_listening_terms ON "listening_terms"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_listening_terms ON "listening_terms"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'listening_terms' AND schemaname = 'public'));

-- ── competitor_profiles ────────────────────────────────────────────────────
ALTER TABLE "competitor_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_competitor_profiles ON "competitor_profiles"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_competitor_profiles ON "competitor_profiles"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'competitor_profiles' AND schemaname = 'public'));

-- ── webhook_endpoints ──────────────────────────────────────────────────────
ALTER TABLE "webhook_endpoints" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_webhook_endpoints ON "webhook_endpoints"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_webhook_endpoints ON "webhook_endpoints"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'webhook_endpoints' AND schemaname = 'public'));

-- ── api_keys ───────────────────────────────────────────────────────────────
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_api_keys ON "api_keys"
  USING ("workspace_id"::text = current_setting('app.current_workspace_id', true))
  WITH CHECK ("workspace_id"::text = current_setting('app.current_workspace_id', true));

CREATE POLICY owner_bypass_api_keys ON "api_keys"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'api_keys' AND schemaname = 'public'));

-- ── audit_logs ─────────────────────────────────────────────────────────────
-- NOTE: workspace_id is nullable on this table.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation_audit_logs ON "audit_logs"
  USING (
    "workspace_id" IS NULL
    OR "workspace_id"::text = current_setting('app.current_workspace_id', true)
  )
  WITH CHECK (
    "workspace_id" IS NULL
    OR "workspace_id"::text = current_setting('app.current_workspace_id', true)
  );

CREATE POLICY owner_bypass_audit_logs ON "audit_logs"
  USING (current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'audit_logs' AND schemaname = 'public'));

-- ---------------------------------------------------------------------------
-- 3. Grant usage to the application role
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO mymanager_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mymanager_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mymanager_app;
