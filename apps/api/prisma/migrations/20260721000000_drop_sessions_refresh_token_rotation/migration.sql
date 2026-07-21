-- Drop the legacy `sessions` table.
--
-- Web auth is NextAuth with a JWT session strategy (no database sessions), and
-- the API's refresh tokens have moved to the purpose-built `refresh_tokens`
-- table, which supports rotation and reuse detection via used_at/revoked_at.
-- The `sessions` table is now unreferenced by application code.
--
-- Deploy impact: any refresh token still living in `sessions` stops working, so
-- users with an active API refresh session are logged out and must sign in
-- again. Access tokens (15m JWTs) keep working until they expire.
DROP TABLE "sessions";

-- Supports RefreshTokenCleanupCron's `expires_at < now` prune without a scan.
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
