-- ═══════════════════════════════════════════════════════════
-- Cascade rules + composite indexes (HIGH-severity audit fixes)
-- ═══════════════════════════════════════════════════════════

-- subscriptions
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_user_id_fkey";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_workspace_id_fkey";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_plan_id_fkey";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- billing_history
ALTER TABLE "billing_history" DROP CONSTRAINT IF EXISTS "billing_history_workspace_id_fkey";
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- plan_overrides
ALTER TABLE "plan_overrides" DROP CONSTRAINT IF EXISTS "plan_overrides_user_id_fkey";
ALTER TABLE "plan_overrides" ADD CONSTRAINT "plan_overrides_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_overrides" DROP CONSTRAINT IF EXISTS "plan_overrides_admin_id_fkey";
ALTER TABLE "plan_overrides" ADD CONSTRAINT "plan_overrides_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_overrides" DROP CONSTRAINT IF EXISTS "plan_overrides_plan_id_fkey";
ALTER TABLE "plan_overrides" ADD CONSTRAINT "plan_overrides_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- workspace_invitations
ALTER TABLE "workspace_invitations" DROP CONSTRAINT IF EXISTS "workspace_invitations_invited_by_id_fkey";
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- blog_posts
ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_author_id_fkey";
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- data_export_requests
ALTER TABLE "data_export_requests" DROP CONSTRAINT IF EXISTS "data_export_requests_user_id_fkey";
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- deletion_requests
ALTER TABLE "deletion_requests" DROP CONSTRAINT IF EXISTS "deletion_requests_user_id_fkey";
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- media_assets
ALTER TABLE "media_assets" DROP CONSTRAINT IF EXISTS "media_assets_workspace_id_fkey";
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- notifications: workspace becomes SetNull
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_workspace_id_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- audit_logs: keep audit row even if user is deleted
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Composite indexes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS "posts_workspace_id_status_scheduled_at_idx"
  ON "posts"("workspace_id", "status", "scheduled_at");

CREATE INDEX IF NOT EXISTS "posts_user_id_created_at_idx"
  ON "posts"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "media_assets_user_id_created_at_idx"
  ON "media_assets"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "notifications_user_id_read_created_at_idx"
  ON "notifications"("user_id", "read", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_workspace_id_action_created_at_idx"
  ON "audit_logs"("workspace_id", "action", "created_at");
