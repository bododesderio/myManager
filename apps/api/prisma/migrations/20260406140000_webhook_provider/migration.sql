-- AlterTable
ALTER TABLE "webhook_endpoints" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'generic';
