# MyManager

> **The all-in-one social media management platform for creators, brands, and agencies.**
> Post once. Reach everywhere.

---

## Current Status (2026-04-03)

| Component | Status | Details |
|-----------|--------|---------|
| **API** | Production-ready | 42 NestJS modules, 91 Prisma models, 8 crons, 21 workers |
| **Web App** | Production-ready | 86 dashboard pages, 54 components, 19 hooks, full auth |
| **Mobile App** | 40% functional | Auth working, compose wired, lists functional, settings UI-only |
| **Docker** | 5 services running | PostgreSQL, Redis, API, Web, Worker — all with health checks |
| **CI/CD** | Configured | 5 GitHub Actions workflows (CI, deploy-api, deploy-web, eas-build, preview) |
| **Tests** | 8 spec files | Auth, billing, publishing, users, guards, webhooks |
| **Security** | Hardened | RLS, AES-256, bcrypt, CSRF, HMAC, CSP, Helmet, rate limiting |

---

## What It Does

MyManager lets individuals, brands, and agencies create, schedule, publish, and analyse social media content across **10 platforms** from a single interface — on web and mobile.

### Platform Support

| Platform | Status | Post Types |
|----------|--------|------------|
| Facebook | Working | Text, image, carousel, video, story |
| Instagram | Working | Image, carousel, Reel, story |
| X / Twitter | Working | Text, image, short video |
| LinkedIn | Working | Text, image, carousel, video, document |
| TikTok | Working | Video, photo carousel |
| Google Business | Working | Update, Event, Offer, Product |
| Pinterest | Working | Image pin, video pin |
| YouTube | Working | Video, Shorts |
| WhatsApp Business | Working | Text, image, video, document broadcast |
| Threads | Working | Text, image, carousel, short video |

### Key Features (Verified Working)

**Content & Publishing**
- Multi-platform composer with platform-specific fields
- 13-status post workflow (Draft → Published)
- BullMQ-based parallel publishing to all 10 platforms
- Content calendar with scheduling
- Post templates and campaigns
- AI captions, hashtags, image generation (Claude + Replicate)

**Team & Collaboration**
- Multi-tenant workspaces with Owner/Admin/Member roles
- Full approval workflow with inline comments
- Client portal with token-based access
- Project-level brand configuration

**Analytics & Reporting**
- Per-platform analytics with daily aggregation
- Best posting times (calculated weekly)
- Hashtag performance tracking
- PDF report generation (Puppeteer)

**Billing**
- Flutterwave integration (MTN MoMo, Airtel Money, Visa/MC)
- 5 plan tiers: Free, Starter ($9/mo), Pro ($19/mo), Enterprise ($79/mo + seats), Custom
- Subscription lifecycle with grace periods
- Currency display in user's local currency

**Admin**
- Superadmin dashboard with queue monitoring
- User management and impersonation
- Plan builder (no code deployment needed)
- CMS for marketing pages, blog, FAQ, testimonials

**Security**
- JWT + refresh token rotation
- TOTP 2FA with backup codes
- AES-256 encrypted OAuth tokens
- PostgreSQL Row-Level Security on 31 tables
- HMAC-SHA256 webhook signatures
- CSRF double-submit cookies
- Prometheus metrics endpoint (`/metrics`)

---

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY
docker compose up --build
```

Services start at:
- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Metrics**: http://localhost:3001/metrics

### Seeded Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@mymanager.app | superadmin123 | Superadmin |
| demo@mymanager.app | demo1234 | Demo user |
| agency@mymanager.app | agency1234 | Agency owner |

### Local Development

```bash
pnpm install
docker compose up postgres redis -d
cd apps/api && npx prisma migrate deploy && npx prisma db seed
pnpm dev
```

---

## Architecture

```
myManager/                    Turborepo monorepo
├── apps/
│   ├── api/                  NestJS REST API (42 modules)
│   ├── web/                  Next.js 15 web app
│   └── mobile/               Expo React Native (SDK 53)
├── packages/                 9 shared packages
│   ├── config/               Zod-validated configuration
│   ├── constants/            Platform/queue/role constants
│   ├── emails/               React Email templates
│   ├── seo/                  Meta/OG/schema builders
│   ├── translations/         i18n (en, ar, es, fr, pt)
│   ├── types/                Shared TypeScript types
│   ├── ui/                   Shared React components
│   ├── utils/                Utility functions
│   └── validators/           Zod schemas
└── docker-compose.yml        5-service stack
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, Prisma 6, PostgreSQL 16, Redis 7, BullMQ |
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Zustand, React Query |
| Mobile | Expo SDK 53, React Native, Zustand, React Query |
| Auth | JWT + refresh tokens, NextAuth 4, Passport |
| Payments | Flutterwave (Africa + global) |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend + React Email |
| AI | Anthropic Claude, Replicate |
| Monitoring | Sentry, Prometheus metrics, PostHog |
| CI/CD | GitHub Actions → Railway (API) + Vercel (Web) + EAS (Mobile) |

### Data Model

91 PostgreSQL tables including:
- Users, sessions, workspaces, members, invitations
- Plans, subscriptions, billing history
- Posts (13 statuses), media assets, templates, campaigns
- Social accounts (11 platforms), OAuth tokens (encrypted)
- Analytics, reports, notifications, webhooks, API keys
- CMS pages, blog posts, brand config, themes
- Audit logs, GDPR compliance (export/deletion requests)

---

## Partially Done

| Feature | Status | What Remains |
|---------|--------|-------------|
| Mobile app | 40% | Settings mutations, analytics API, real-time, media upload |
| i18n | Framework ready | Only English strings populated (5 locale dirs exist) |
| Google OAuth (web) | Backend ready | Frontend shows "Coming soon" badge |
| Social listening | API module exists | No real platform API calls to fetch mentions |
| Competitor tracking | Schema + cron ready | No real API calls to fetch competitor metrics |

## Not Yet Started

- Slack / Zapier / Make integrations
- Browser share extension
- Video auto-captioning (Whisper)
- LanguageTool grammar checking
- Stock photo API integration
- Public status page

---

## Pricing

| Plan | Price | Posts/mo | Accounts | Storage | AI Credits |
|------|-------|----------|----------|---------|------------|
| Free | $0 | 4 | 2 | — | — |
| Starter | $9/mo | 30 | 3 | 2 GB | 20 |
| Pro | $19/mo | 200 | 6 | 10 GB | 100 |
| Enterprise | $79/mo + $15/seat | 500 | 20 | 50 GB | 500 |
| Custom | Contact sales | Negotiated | Unlimited | Negotiated | Negotiated |

All limits adjustable by superadmin without code changes.

---

## Contact

For custom plans, reseller inquiries, or API access:
→ Contact form at `/contact` — handled within 1 business day.

---

## Changelog

### 2026-04-03

**Tests & Quality**
- Added test suite for ApiKeyGuard (bcrypt validation, rate limiting, header injection)
- Added test suite for WorkspaceMemberGuard (role resolution, superadmin bypass, resource inference)
- Added test suite for WebhooksService (event dispatch, retry logic, social webhook handling)
- Added test suite for WebhookDeliveryWorker (HMAC signing, exponential backoff, max retry)
- Test coverage expanded from 4 to 8 spec files across critical modules

**Features**
- Wired mobile compose screen with real API mutations (publish, schedule, save draft)
- Added `useSchedulePost()` hook to mobile app
- Added remember-me checkbox to web login form (30-day vs 24-hour sessions)
- Added Prometheus metrics endpoint (`GET /metrics`) with 7 metric families
- Added MetricsInterceptor for HTTP request counting by method/status

**Security**
- Implemented PostgreSQL Row-Level Security on 31 workspace-scoped tables
- Created `setWorkspaceContext()` utility with UUID validation (SQL injection safe)
- Owner bypass policies for migration compatibility
- Nullable workspace_id handling for notifications, audit_logs, ai_credit_usage

**Infrastructure**
- Added `python3 make g++` to Dockerfile builder stage (fixes bcrypt native compilation on Alpine)
- Same fix applied to Dockerfile.worker builder stage

### 2026-04-02

**Security Hardening**
- Fixed login flow: removed empty `totp_code` being sent to API (caused 401 on non-2FA accounts)
- Fixed `emailVerified` field: was passing raw string to `new Date()` constructor, now uses `new Date()`
- Added DOMPurify sanitization to blog post HTML rendering
- Added safe redirect URL validation on login callback (prevents open redirect)
- Removed `unsafe-eval` from CSP `script-src` directive
- Added timing-safe comparison for webhook signature verification
- Hardened social webhook route to reject unknown platforms

**Bug Fixes**
- Fixed PricingToggle crash when `plan.features` is object instead of array
- Fixed blog page crash on missing/empty API responses with fallback defaults
- Fixed marketing pages (landing, features, about, contact) graceful handling of missing CMS data
- Fixed MarketingNavbar and MarketingFooter to use CSS variables instead of hardcoded colors
- Fixed FileUpload component error handling

**Infrastructure**
- Deleted dormant `.trunk/` linter config directory
- Cleaned up redundant `.eslintrc.json` (project uses `eslint.config.mjs`)
- Added worker service to docker-compose.yml (background job processing)
- Fixed Dockerfile.worker: added `@nestjs/cli`, `uploads` directory, `tsx` import

### 2026-03-24

**Features**
- Platforms API and OAuth flow for 11 social platforms
- Admin sections: audit log, credentials manager, system settings
- Rich text editor (CKEditor 5) integration
- File upload with Cloudflare R2 and local fallback
- Mobile app wiring to real APIs (auth, dashboard, posts)

### 2026-03-20

**Schema**
- Phase 3 schema update: added projects, campaigns, reports, bio pages, webhooks, API keys

### 2026-03-18

**Initial Release**
- Initial commit: myManager SaaS platform
- NestJS API with 42 modules
- Next.js web app with 86 dashboard pages
- Expo React Native mobile app
- PostgreSQL + Redis + BullMQ infrastructure
- Flutterwave billing integration
- 11 social platform OAuth integrations

---

*Working name: MyManager. All branding, naming, domain, and copy are fully configurable via the platform white-label system.*
