# Deployment Guide

This document covers how to deploy all myManager services to production.

| Service | Platform | Runtime |
|---------|----------|---------|
| API (NestJS) | Railway | Node 20 + Docker |
| Worker (BullMQ) | Railway | Node 20 + Docker |
| Web (Next.js) | Vercel | Edge + Node 20 |
| Mobile (Expo) | EAS Build + EAS Submit | iOS / Android |

---

## 1. Railway Deployment (API + Worker)

### Prerequisites

- A Railway account at <https://railway.app>
- Railway CLI installed: `npm i -g @railway/cli`
- A project created in Railway with **Postgres** and **Redis** plugins added

### Project structure

The API and Worker share the same codebase (`apps/api/`) but use different Dockerfiles:

- **API**: `apps/api/Dockerfile` (runs `npm run start:prod`)
- **Worker**: `apps/api/Dockerfile.worker` (runs `npm run start:worker`)

### Setting up services in Railway Dashboard

1. Open your Railway project
2. Click **New Service** > **GitHub Repo** and select this repository
3. Set the **Root Directory** to `apps/api`
4. Under **Settings > Build**, set the **Dockerfile Path** to `Dockerfile`
5. Repeat steps 2-4 for the Worker service, but set the Dockerfile path to `Dockerfile.worker`
6. Add **Postgres** and **Redis** plugins if not already added

### Environment variables via Railway Dashboard

1. Click on the API service > **Variables**
2. Click **Add Variable** and add each variable from `.env.production.example`
3. For database and Redis, use Railway reference variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
4. Railway automatically injects `PORT` -- do NOT set it manually
5. Repeat for the Worker service (it needs the same variables minus the web-facing URLs)

### Environment variables via Railway CLI

```bash
# Login
railway login

# Link to your project
railway link

# Set variables for the API service
railway variables set JWT_SECRET="$(openssl rand -base64 48)" --service api
railway variables set NEXTAUTH_SECRET="$(openssl rand -base64 48)" --service api
railway variables set ENCRYPTION_KEY="$(openssl rand -hex 32)" --service api
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}' --service api
railway variables set REDIS_URL='${{Redis.REDIS_URL}}' --service api
railway variables set NEXT_PUBLIC_API_URL="https://api.mymanager.com" --service api
railway variables set WEB_URL="https://app.mymanager.com" --service api
railway variables set STORAGE_DRIVER="r2" --service api
railway variables set RESEND_API_KEY="re_xxxx" --service api

# Set variables for the Worker service (same secrets, no web URLs needed)
railway variables set JWT_SECRET="<same-as-api>" --service worker
railway variables set ENCRYPTION_KEY="<same-as-api>" --service worker
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}' --service worker
railway variables set REDIS_URL='${{Redis.REDIS_URL}}' --service worker
railway variables set STORAGE_DRIVER="r2" --service worker
```

### Custom domains

1. In Railway Dashboard, go to the API service > **Settings > Networking**
2. Click **Generate Domain** or add a custom domain (`api.mymanager.com`)
3. Add the CNAME record to your DNS provider as shown

### Database migrations

Migrations run automatically on API startup via Prisma. To run them manually:

```bash
# Via Railway CLI (runs inside the service container)
railway run --service api npx prisma migrate deploy

# Or connect to the Railway Postgres directly
railway connect postgres
# Then in a local shell with DATABASE_URL set:
npx prisma migrate deploy
```

To seed the database:

```bash
railway run --service api npx prisma db seed
```

### Deploying updates

Railway auto-deploys on push to the `main` branch when connected to GitHub. To deploy manually:

```bash
railway up --service api
railway up --service worker
```

---

## 2. Vercel Deployment (Web)

### Prerequisites

- A Vercel account at <https://vercel.com>
- Vercel CLI installed: `npm i -g vercel`

### Initial setup via Vercel Dashboard

1. Go to <https://vercel.com/new> and import this repository
2. Set the **Root Directory** to `apps/web`
3. Framework Preset should auto-detect **Next.js**
4. Under **Build & Development Settings**, the defaults are usually fine:
   - Build Command: `next build`
   - Output Directory: `.next`

### Environment variables via Vercel Dashboard

1. Go to your project > **Settings > Environment Variables**
2. Add each variable from `.env.production.example` that starts with `NEXT_PUBLIC_` or is needed at build/runtime:

| Variable | Environment | Notes |
|----------|-------------|-------|
| `NEXT_PUBLIC_APP_URL` | Production | `https://app.mymanager.com` |
| `NEXT_PUBLIC_API_URL` | Production | `https://api.mymanager.com` |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Production | Flutterwave public key |
| `NEXTAUTH_URL` | Production | `https://app.mymanager.com` |
| `NEXTAUTH_SECRET` | Production | Same as API's NEXTAUTH_SECRET |
| `AUTH_SECRET` | Production | Same as NEXTAUTH_SECRET |
| `API_URL` | Production | Railway private URL or public API URL |
| `SENTRY_DSN` | Production | Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Production | For source map uploads during build |
| `POSTHOG_API_KEY` | Production | PostHog analytics |

### Environment variables via Vercel CLI

```bash
# Login
vercel login

# Link to your project
vercel link

# Set environment variables (production)
vercel env add NEXT_PUBLIC_APP_URL production
# Enter value when prompted: https://app.mymanager.com

vercel env add NEXT_PUBLIC_API_URL production
# Enter value: https://api.mymanager.com

vercel env add NEXTAUTH_SECRET production
# Enter value: <your-secret>

# Or use piping for non-interactive usage
echo "https://app.mymanager.com" | vercel env add NEXT_PUBLIC_APP_URL production
```

### Custom domains

1. Go to your project > **Settings > Domains**
2. Add `app.mymanager.com`
3. Configure DNS as instructed (CNAME to `cname.vercel-dns.com`)

### Deploying updates

Vercel auto-deploys on push to `main`. To deploy manually:

```bash
vercel --prod
```

---

## 3. EAS Deployment (Mobile)

### Prerequisites

- An Expo account at <https://expo.dev>
- EAS CLI installed: `npm i -g eas-cli`
- Apple Developer and/or Google Play Console accounts

### Initial setup

```bash
cd apps/mobile

# Login to Expo
eas login

# Configure EAS Build (creates eas.json if not present)
eas build:configure
```

### Environment variables

Mobile environment variables are set in `apps/mobile/eas.json` under the `env` key for each build profile, or as EAS Secrets:

```bash
# Set secrets via EAS CLI
eas secret:create --name API_URL --value "https://api.mymanager.com" --scope project
eas secret:create --name SENTRY_DSN --value "https://xxx@sentry.io/xxx" --scope project
```

Key variables for the mobile app:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Public API URL (baked into the JS bundle) |
| `EXPO_PUBLIC_APP_URL` | Web app URL for deep links |
| `SENTRY_DSN` | Error tracking |

### Building

```bash
# Development build (internal distribution)
eas build --profile development --platform all

# Production build
eas build --profile production --platform all
```

### Submitting to stores

```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android
```

### CI/CD

Set `EXPO_TOKEN` in GitHub Actions secrets for automated builds:

```yaml
env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 4. Database Migration Checklist

Before deploying a version that includes schema changes:

1. **Review the migration**: Check `apps/api/prisma/migrations/` for the new migration SQL
2. **Back up the database**: `railway run --service api pg_dump $DATABASE_URL > backup.sql`
3. **Deploy the API**: Push to `main` or run `railway up --service api`
4. **Verify migration ran**: Check API startup logs for `Prisma Migrate: Applied X migrations`
5. **If migration fails**: The API will fail to start. Check logs, fix the migration, and redeploy

To create a new migration locally:

```bash
cd apps/api
npx prisma migrate dev --name describe_your_change
```

---

## 5. Post-Deployment Verification

After deploying all services, verify:

- [ ] API health check: `curl https://api.mymanager.com/health`
- [ ] Web app loads: visit `https://app.mymanager.com`
- [ ] Login flow works end-to-end
- [ ] OAuth connections work for each configured platform
- [ ] Webhook endpoints respond (test with Meta webhook verification)
- [ ] BullMQ worker is processing jobs (check queue monitor in admin dashboard)
- [ ] Email sending works (trigger a test email via password reset)
- [ ] File uploads work (upload an image in the media library)
- [ ] Sentry is receiving errors (trigger a test error)

---

## 6. Secrets Rotation

When rotating secrets:

1. **JWT_SECRET**: Rotating invalidates all active sessions. Deploy during low-traffic hours.
2. **ENCRYPTION_KEY**: NEVER rotate without a migration script to re-encrypt all stored OAuth tokens.
3. **NEXTAUTH_SECRET**: Rotating invalidates all web sessions. Users must re-login.
4. **WEBHOOK_VERIFY_TOKEN**: Update in both Railway and the Meta/platform developer dashboard simultaneously.
5. **FLUTTERWAVE_WEBHOOK_SECRET**: Update in both Railway and the Flutterwave dashboard simultaneously.

Update secrets in Railway and Vercel, then trigger a redeploy for changes to take effect.
