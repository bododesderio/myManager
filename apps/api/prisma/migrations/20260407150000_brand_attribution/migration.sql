-- Add Rooibok attribution columns to brand_configs and update existing footer defaults.

ALTER TABLE "brand_configs"
  ADD COLUMN "footer_attribution_text" TEXT NOT NULL DEFAULT 'Developed by Rooibok Technologies Limited',
  ADD COLUMN "footer_attribution_url"  TEXT NOT NULL DEFAULT 'https://rooibok.net';

-- Drop "Limited"/"Ltd" from existing copyright string and update the made_in line.
UPDATE "brand_configs"
SET
  "footer_copyright" = '© 2025–2026 myManager. All rights reserved.',
  "footer_made_in"   = 'Developed from Uganda'
WHERE
  "footer_copyright" LIKE '%Ltd%'
  OR "footer_copyright" LIKE '%Limited%'
  OR "footer_made_in"   LIKE '%Kampala%';
