-- Repoint social_accounts.platform_id FK from platforms.id (UUID) to platforms.slug.
--
-- The whole pipeline (Post.platforms String[], the publishing workers, the
-- OAuth callback) treats social_accounts.platform_id as the catalogue *slug*
-- (e.g. `google_business`). The original FK referenced platforms.id (a UUID),
-- so an inserted slug could never match — no social account was ever insertable.
-- platforms.slug is UNIQUE (platforms_slug_key), so it is a valid FK target.
ALTER TABLE "social_accounts" DROP CONSTRAINT "social_accounts_platform_id_fkey";

ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_platform_id_fkey"
  FOREIGN KEY ("platform_id") REFERENCES "platforms"("slug") ON UPDATE CASCADE ON DELETE RESTRICT;
