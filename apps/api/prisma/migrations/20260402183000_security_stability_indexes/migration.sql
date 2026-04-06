-- Performance and audit hardening indexes
CREATE INDEX IF NOT EXISTS "billing_history_workspace_id_created_at_idx"
ON "billing_history" ("workspace_id", "created_at");

CREATE INDEX IF NOT EXISTS "billing_history_user_id_created_at_idx"
ON "billing_history" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "billing_history_flutterwave_ref_idx"
ON "billing_history" ("flutterwave_ref");

CREATE INDEX IF NOT EXISTS "projects_workspace_id_created_at_idx"
ON "projects" ("workspace_id", "created_at");

CREATE INDEX IF NOT EXISTS "projects_workspace_id_status_idx"
ON "projects" ("workspace_id", "status");

CREATE INDEX IF NOT EXISTS "campaigns_workspace_id_created_at_idx"
ON "campaigns" ("workspace_id", "created_at");

CREATE INDEX IF NOT EXISTS "report_configs_workspace_id_created_at_idx"
ON "report_configs" ("workspace_id", "created_at");

CREATE INDEX IF NOT EXISTS "report_configs_workspace_id_is_active_idx"
ON "report_configs" ("workspace_id", "is_active");

CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_endpoint_id_created_at_idx"
ON "webhook_deliveries" ("webhook_endpoint_id", "created_at");

CREATE INDEX IF NOT EXISTS "webhook_deliveries_next_retry_at_idx"
ON "webhook_deliveries" ("next_retry_at");
