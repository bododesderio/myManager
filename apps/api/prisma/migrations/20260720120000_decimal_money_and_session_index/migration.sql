-- Phase 1 remediation (docs/audit-2026-07-20.md §H3, §H4)
--
-- 1. Money columns Float -> Decimal.
--    Prices were already Decimal(10,2) in `plans`, but every column the money
--    actually flowed INTO was double precision. Precision was therefore lost at
--    the exact moment a price became a charge. Existing values were written from
--    2dp sources, so the cast is stable (a stored 8.999999999999998 lands on
--    9.00), but it is one-way — verify a backup exists before deploying.
--
-- 2. exchange_rates.rate -> Decimal(18,8).
--    Rates multiply into charge amounts, so float drift here propagates into
--    every non-USD payment. 8dp covers low-value currencies (UGX, IDR).
--
-- 3. sessions(user_id) index.
--    `sessions` doubles as refresh-token storage, so logout, password change and
--    "sign out all devices" all filter by user_id — previously a sequential scan
--    on the hottest security path.
--
--    NOTE: this runs as a plain CREATE INDEX inside Prisma's migration
--    transaction, which takes an ACCESS EXCLUSIVE lock on `sessions` for the
--    duration. On a large sessions table, run this out-of-band as
--    `CREATE INDEX CONCURRENTLY` first (it is a no-op here if it already
--    exists), then deploy this migration.

-- AlterTable
ALTER TABLE "billing_history" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "exchange_rates" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "seat_price_usd" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "subscription_items" ALTER COLUMN "unit_price" SET DEFAULT 0,
ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "billing_amount" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
