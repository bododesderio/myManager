-- Additional registration profile fields.
-- users.first_name/last_name already existed but were never persisted at signup
-- (fixed in the register repository alongside these new columns).
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "job_title" TEXT;
ALTER TABLE "users" ADD COLUMN "country" TEXT;

ALTER TABLE "workspaces" ADD COLUMN "website" TEXT;
