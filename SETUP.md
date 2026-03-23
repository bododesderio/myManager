# Local Development Setup

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop/))

## Quick Start

```bash
# 1. Clone and enter the repo
cd mymanager

# 2. Copy environment variables
cp .env.example .env
# Fill in required values (DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, etc.)

# 3. Start local services (PostgreSQL 16 + Redis 7)
docker compose up -d

# 4. Install all dependencies
pnpm install

# 5. Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# 6. Run database migrations
cd apps/api && npx prisma migrate dev --name init && cd ../..

# 7. Seed the database
cd apps/api && npx ts-node prisma/seeds/plans.seed.ts && cd ../..

# 8. Start all apps in development mode
pnpm dev
```

## Default Local URLs

| Service    | URL                        |
|------------|----------------------------|
| Web app    | http://localhost:3000       |
| API server | http://localhost:4000       |
| API docs   | http://localhost:4000/api/docs |
| PostgreSQL | localhost:5432              |
| Redis      | localhost:6379              |

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

For local development with Docker Compose, use these values:

```env
DATABASE_URL=postgresql://mymanager:mymanager_dev@localhost:5432/mymanager
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

All other variables can remain empty for local development unless you need to test specific integrations (social OAuth, payments, email sending, etc.).

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
