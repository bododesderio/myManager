# Local Development Setup

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop/))

## Quick Start (Docker — Recommended)

The fastest way to get everything running:

```bash
# 1. Clone and enter the repo
cd mymanager

# 2. Copy environment variables
cp .env.example .env
# Fill in required values (see .env.example for documentation)

# 3. Build and start all services (PostgreSQL, Redis, API, Web)
docker compose up --build

# 4. In a separate terminal, seed the database
docker exec mymanager-api sh -c "npx ts-node prisma/seeds/index.ts"
```

This starts all 4 services. The API runs migrations automatically on startup.

## Quick Start (Local Development)

For active development with hot-reload:

```bash
# 1. Clone and enter the repo
cd mymanager

# 2. Copy environment variables
cp .env.example .env

# 3. Start database services only
docker compose up -d postgres redis

# 4. Install all dependencies
pnpm install

# 5. Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# 6. Run database migrations
cd apps/api && npx prisma migrate dev --name init && cd ../..

# 7. Seed the database (all seeds: brand, plans, platforms, users, CMS, blog, FAQ, testimonials)
cd apps/api && npx ts-node prisma/seeds/index.ts && cd ../..

# 8. Start all apps in development mode
pnpm dev
```

## Default Local URLs

| Service    | URL                           |
|------------|-------------------------------|
| Web app    | http://localhost:3000          |
| API server | http://localhost:3001          |
| API docs   | http://localhost:3001/api/docs |
| PostgreSQL | localhost:5432                 |
| Redis      | localhost:6379                 |

## Individual App Commands

```bash
# Web app (Next.js)
pnpm --filter @mymanager/web dev

# API server (NestJS)
pnpm --filter @mymanager/api dev

# Mobile app (Expo)
pnpm --filter @mymanager/mobile start

# Run all builds
pnpm build

# Run all linting
pnpm lint

# Run type checking
pnpm type-check

# Run all tests
pnpm test
```

## Local Environment Variables

For local development, these are the minimum required values:

```env
DATABASE_URL=postgresql://mymanager:mymanager_dev@localhost:5432/mymanager_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-jwt-secret-change-in-production-32chars
NEXTAUTH_SECRET=local-dev-secret-change-in-production-32chars
NEXTAUTH_URL=http://localhost:3000
ENCRYPTION_KEY=<64-hex-char-string>  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
FLUTTERWAVE_WEBHOOK_SECRET=local-dev-webhook-secret
RESEND_API_KEY=re_dev_placeholder
STORAGE_DRIVER=local
PORT=3001
```

All other variables (social OAuth, payments, AI, analytics) can remain empty for local development. For production, manage credentials via the Super Admin Credentials page at `/admin/settings/credentials`.

## Useful Commands

```bash
# Reset database
cd apps/api && npx prisma migrate reset && cd ../..

# Open Prisma Studio (database GUI)
cd apps/api && npx prisma studio && cd ../..

# Validate Prisma schema
cd apps/api && npx prisma validate && cd ../..

# Generate Prisma client after schema changes
cd apps/api && npx prisma generate && cd ../..

# Check turbo task graph
pnpm turbo build --dry-run
```
