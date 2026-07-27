-- Hybrid premium tier (per-platform adaptation Phase 1).
-- NULL = follow the auto-detected tier stored in metadata.detected_tier;
-- TRUE/FALSE = a user override that always wins.
ALTER TABLE "social_accounts" ADD COLUMN "premium_override" BOOLEAN;
