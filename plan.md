# MyManager — Master Technical Plan

> Working name: **MyManager** | All names, logos, colors, copy, and legal text are fully white-label replaceable via the BrandConfig system. Nothing is hardcoded.

---

## Table of Contents

1. [Tech Stack — Final Confirmed](#1-tech-stack)
2. [Monorepo File Structure](#2-monorepo-file-structure)
3. [Content Types Per Platform](#3-content-types-per-platform)
4. [Platform Support Matrix](#4-platform-support-matrix)
5. [Database Tables — Full List](#5-database-tables)
6. [API Architecture](#6-api-architecture)
7. [Worker Architecture](#7-worker-architecture)
8. [Feature Specifications](#8-feature-specifications)
9. [White-Label System](#9-white-label-system)
10. [Multilingual & Multicurrency](#10-multilingual--multicurrency)
11. [Billing & Plans](#11-billing--plans)
12. [Security Model](#12-security-model)
13. [Deployment Architecture](#13-deployment-architecture)
14. [CI/CD Pipeline](#14-cicd-pipeline)
15. [Build Phases & Timeline](#15-build-phases--timeline)
16. [Naming & Code Conventions](#16-naming--code-conventions)

---

## 1. Tech Stack

### Final Confirmed Stack (100% confidence on every choice)

| Layer | Technology | Version | Why |
|---|---|---|---|
| Web app + Admin | Next.js | 15 (App Router) | RSC, SSR, Edge Middleware, ISR, OG image generation. Admin is a middleware-gated route group `(admin)/` inside `apps/web` — one codebase, one deployment, role-checked at the edge. |
| Mobile app | Expo + React Native | SDK 53 | One codebase → iOS + Android, EAS Build |
| Backend API | NestJS | 10 | TypeScript-native, DI, guards, interceptors, decorators |
| ORM | Prisma | 5 | Type-safe DB access, migrations as code |
| Database | PostgreSQL | 16 | Primary datastore, JSONB, RLS, full-text search |
| Cache + Queues | Redis + BullMQ | Redis 7 | Session cache, rate limits, job queues, pub/sub |
| Authentication | NextAuth.js v5 + Passport.js | v5 / v0.7 | Full control, no per-MAU cost, custom roles |
| Payment processing | Flutterwave | v3 API | Licensed in Uganda, MTN MoMo, Airtel, cards, Google Pay, Apple Pay |
| Media storage | Cloudflare R2 | — | S3-compatible, zero egress fees |
| CDN + DNS + IP geo | Cloudflare | Free tier | CF-IPCountry header, edge cache, DDoS protection |
| Email sending | Resend | — | React Email templates, 2K/day free |
| Email templates | React Email | — | React components for transactional emails |
| Real-time | Socket.io | 4 | Live post status, notifications |
| Monorepo | Turborepo + pnpm | — | One repo, shared packages, parallel builds |
| State (web) | TanStack Query v5 + Zustand | — | Server state + client state separation |
| UI components | shadcn/ui + Tailwind v4 | — | Copy-owned components, utility-first CSS |
| Mobile routing | Expo Router | v4 (ships with SDK 53) | File-based routing for React Native |
| Mobile state | Zustand + MMKV | — | Lightweight global state + fast local storage |
| PDF generation | Puppeteer | 22 | Headless Chrome → pixel-perfect PDF reports |
| Translation | next-intl (web) + i18next (mobile) | — | Shared translation files in packages/translations |
| Exchange rates | Open Exchange Rates API | — | Hourly rate fetch, cached in Redis |
| AI captions | Claude claude-sonnet-4-20250514 | — | Caption generation, tone rewrite, image analysis |
| AI image gen | Replicate (Stable Diffusion) | — | Text-to-image for post visuals |
| Speech-to-text | OpenAI Whisper API | — | Video auto-captions, accessibility |
| Grammar check | LanguageTool | Self-hosted | Real-time spell/grammar, zero data leakage |
| Stock photos | Unsplash API + Pexels API | — | Free with attribution |
| Error tracking | Sentry | — | Errors across API, web, mobile |
| Product analytics | PostHog | — | Funnels, session recordings, feature flags |
| Web hosting | Vercel | Pro | Zero-config Next.js, edge middleware, preview URLs |
| API + workers hosting | Railway | — | Managed PostgreSQL, Redis, Docker, auto-deploy |
| CI/CD | GitHub Actions | — | Lint → type-check → test → build → deploy |
| Container | Docker | — | NestJS API + workers containerised |
| App distribution | EAS Build | — | Expo Application Services, OTA updates |

---

## 2. Monorepo File Structure

```
mymanager/                              ← single git repository (Turborepo + pnpm workspaces)
│
├── apps/
│   │
│   ├── web/                            ← Next.js 15 · user web app + admin dashboard
│   │   ├── app/
│   │   │   ├── (marketing)/            ← public SSR pages
│   │   │   │   ├── page.tsx            ← home / landing
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   ├── features/page.tsx
│   │   │   │   ├── about/page.tsx
│   │   │   │   ├── blog/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   ├── legal/
│   │   │   │   │   ├── privacy/page.tsx
│   │   │   │   │   └── terms/page.tsx
│   │   │   │   └── contact/page.tsx
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   └── verify-email/page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/            ← protected · requires auth
│   │   │   │   ├── layout.tsx          ← sidebar, topbar, workspace context
│   │   │   │   ├── home/page.tsx       ← post feed + quick compose
│   │   │   │   ├── compose/page.tsx    ← full composer
│   │   │   │   ├── calendar/page.tsx   ← content calendar
│   │   │   │   ├── drafts/page.tsx
│   │   │   │   ├── media/page.tsx      ← media library
│   │   │   │   ├── templates/page.tsx
│   │   │   │   ├── campaigns/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [platform]/page.tsx
│   │   │   │   │   ├── hashtags/page.tsx
│   │   │   │   │   └── benchmarks/page.tsx
│   │   │   │   ├── posts/
│   │   │   │   │   └── [id]/page.tsx   ← individual post performance
│   │   │   │   ├── conversations/page.tsx  ← comment inbox
│   │   │   │   ├── reports/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── projects/           ← Enterprise only
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── analytics/page.tsx
│   │   │   │   │       └── settings/page.tsx
│   │   │   │   ├── team/page.tsx
│   │   │   │   ├── approvals/page.tsx
│   │   │   │   ├── bio/page.tsx        ← link in bio builder
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx        ← profile
│   │   │   │       ├── accounts/page.tsx   ← connected socials
│   │   │   │       ├── billing/page.tsx
│   │   │   │       ├── workspace/page.tsx
│   │   │   │       ├── notifications/page.tsx
│   │   │   │       ├── security/page.tsx   ← 2FA
│   │   │   │       ├── privacy/page.tsx    ← GDPR
│   │   │   │       ├── integrations/page.tsx   ← webhooks, API keys, Slack
│   │   │   │       ├── brand/page.tsx      ← workspace brand (Enterprise)
│   │   │   │       └── language/page.tsx   ← locale preferences
│   │   │   │
│   │   │   ├── (admin)/                ← superadmin only · middleware-gated
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx            ← platform overview
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── workspaces/
│   │   │   │   ├── plans/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── billing/
│   │   │   │   │   ├── page.tsx        ← MRR, subscriptions
│   │   │   │   │   ├── overrides/page.tsx
│   │   │   │   │   └── leads/page.tsx  ← contact sales leads
│   │   │   │   ├── queue/page.tsx      ← BullMQ monitor
│   │   │   │   ├── api-health/page.tsx ← platform API status
│   │   │   │   ├── brand/page.tsx      ← platform-wide white-label editor
│   │   │   │   ├── content/
│   │   │   │   │   ├── pages/page.tsx
│   │   │   │   │   ├── emails/page.tsx
│   │   │   │   │   ├── translations/page.tsx
│   │   │   │   │   └── legal/page.tsx
│   │   │   │   └── seo/page.tsx
│   │   │   │
│   │   │   ├── portal/[token]/page.tsx ← client portal (no auth)
│   │   │   ├── internal/report-render/[jobId]/page.tsx  ← Puppeteer render target
│   │   │   ├── api/                    ← Next.js route handlers (BFF)
│   │   │   │   ├── auth/[...nextauth]/
│   │   │   │   ├── upload/route.ts
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── flutterwave/route.ts
│   │   │   │   │   └── social/[platform]/route.ts
│   │   │   │   └── email/
│   │   │   │       └── unsubscribe/route.ts
│   │   │   │
│   │   │   ├── sitemap.ts              ← dynamic sitemap
│   │   │   ├── robots.ts               ← dynamic robots.txt (domain from brand config)
│   │   │   ├── manifest.ts             ← PWA manifest (from brand config)
│   │   │   ├── opengraph-image.tsx     ← dynamic OG image (brand logo + colors)
│   │   │   ├── layout.tsx              ← root layout (injects brand metadata + CSS vars)
│   │   │   └── not-found.tsx / error.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── composer/               ← PostComposer, PlatformToggle, MediaTray, FirstComment
│   │   │   ├── previews/               ← FacebookPreview, InstagramPreview, XPreview,
│   │   │   │                           ←   LinkedInPreview, TikTokPreview, GBPPreview,
│   │   │   │                           ←   PinterestPreview, YouTubePreview, WhatsAppPreview, ThreadsPreview
│   │   │   ├── analytics/              ← MetricCard, EngagementChart, PlatformBreakdown
│   │   │   ├── calendar/               ← ContentCalendar, DragDropScheduler, CampaignBar
│   │   │   ├── media/                  ← MediaLibrary, ImageEditor, VideoTrimmer, StockPhotoPicker
│   │   │   ├── reports/                ← ReportBuilder, ReportViewer
│   │   │   ├── approvals/              ← ApprovalTimeline, InlineComment
│   │   │   ├── layout/                 ← Sidebar, Topbar, LanguageSwitcher, CurrencyDisplay
│   │   │   ├── marketing/              ← PricingCard, FeatureSection, HeroSection
│   │   │   └── admin/                  ← PlanBuilder, BrandEditor, QueueMonitor, UserImpersonation
│   │   │
│   │   ├── brand.config.ts             ← imports from packages/config (no values here)
│   │   ├── middleware.ts               ← auth guard, plan guard, admin guard, locale redirect
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts
│   │
│   ├── mobile/                         ← Expo SDK 52 · iOS + Android
│   │   ├── app/                        ← Expo Router file-based routing
│   │   │   ├── _layout.tsx             ← root layout, BrandProvider, theme
│   │   │   ├── index.tsx               ← redirect to (auth) or (tabs)
│   │   │   ├── (auth)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── forgot-password.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx         ← tab bar (icons/labels from brand config)
│   │   │   │   ├── home.tsx
│   │   │   │   ├── compose.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── analytics.tsx
│   │   │   │   └── settings.tsx
│   │   │   ├── compose/
│   │   │   │   ├── new.tsx             ← full-screen composer
│   │   │   │   └── preview.tsx         ← platform preview screen
│   │   │   ├── post/[id].tsx
│   │   │   ├── approvals/
│   │   │   │   └── index.tsx           ← approval queue (Enterprise)
│   │   │   ├── conversations/
│   │   │   │   └── index.tsx           ← comment inbox
│   │   │   ├── reports/
│   │   │   │   └── index.tsx           ← view generated reports (download/share)
│   │   │   ├── campaigns/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [id].tsx
│   │   │   ├── bio/index.tsx           ← link in bio viewer/editor (limited on mobile)
│   │   │   ├── projects/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [id].tsx
│   │   │   ├── media/index.tsx
│   │   │   └── settings/
│   │   │       ├── accounts.tsx
│   │   │       ├── billing.tsx
│   │   │       ├── security.tsx
│   │   │       ├── team.tsx
│   │   │       ├── notifications.tsx
│   │   │       └── language.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── composer/
│   │   │   ├── previews/               ← all 10 platform previews (React Native)
│   │   │   ├── analytics/
│   │   │   ├── media/                  ← CameraPicker, GalleryPicker, MediaEditor
│   │   │   └── ui/                     ← BottomSheet, ActionSheet, Toast
│   │   │
│   │   ├── hooks/                      ← useBrand, useAuth, usePlan, usePosts, useLocale
│   │   ├── store/                      ← Zustand: authStore, draftStore, workspaceStore
│   │   ├── services/                   ← apiClient, oauthHandlers, pushNotifications
│   │   ├── assets/                     ← empty — all loaded from brand config at runtime
│   │   ├── brand.config.ts             ← imports from packages/config
│   │   ├── app.json                    ← Expo config (app name from brand config at build)
│   │   ├── eas.json                    ← EAS Build profiles
│   │   └── metro.config.js
│   │
│   └── api/                            ← NestJS monolith + BullMQ workers
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/               ← JWT, refresh tokens, Google/Apple OAuth
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── strategies/     ← jwt.strategy, google.strategy, apple.strategy
│       │   │   │   └── guards/         ← jwt.guard, roles.guard, plan.guard
│       │   │   ├── users/
│       │   │   ├── workspaces/
│       │   │   ├── projects/
│       │   │   ├── posts/
│       │   │   ├── social-accounts/    ← OAuth connect, token refresh, platform validation
│       │   │   ├── publishing/         ← dispatcher → kicks off BullMQ workers
│       │   │   ├── analytics/          ← fetch + store platform metrics, sync cron
│       │   │   ├── media/              ← upload, process, R2 storage, quota enforcement
│       │   │   ├── plans/              ← plan definitions CRUD
│       │   │   ├── billing/            ← Flutterwave integration, webhooks, subscriptions
│       │   │   ├── notifications/      ← in-app, email, push, browser push
│       │   │   ├── approvals/          ← state machine, inline comments
│       │   │   ├── reports/            ← report generation, PDF, CSV, scheduling
│       │   │   ├── brand/              ← white-label config API
│       │   │   ├── templates/          ← post templates
│       │   │   ├── campaigns/          ← campaign management
│       │   │   ├── ai/                 ← Claude captions, Whisper captions, image gen
│       │   │   ├── bio-pages/          ← link in bio
│       │   │   ├── comments/           ← social comment inbox
│       │   │   ├── rss/                ← RSS feed import
│       │   │   ├── listening/          ← brand monitoring, trending topics
│       │   │   ├── competitors/        ← competitor benchmarking
│       │   │   ├── webhooks/           ← outgoing webhook delivery
│       │   │   ├── api-keys/           ← public API key management
│       │   │   ├── sales-leads/        ← contact sales form
│       │   │   └── audit/              ← audit log
│       │   │
│       │   ├── workers/                ← BullMQ workers (separate Docker process)
│       │   │   ├── platforms/
│       │   │   │   ├── base.worker.ts  ← shared abstract worker
│       │   │   │   ├── facebook.worker.ts
│       │   │   │   ├── instagram.worker.ts
│       │   │   │   ├── x.worker.ts
│       │   │   │   ├── linkedin.worker.ts
│       │   │   │   ├── tiktok.worker.ts        ← 3-step chunked upload
│       │   │   │   ├── google-business.worker.ts
│       │   │   │   ├── pinterest.worker.ts
│       │   │   │   ├── youtube.worker.ts       ← resumable upload
│       │   │   │   ├── whatsapp.worker.ts
│       │   │   │   └── threads.worker.ts
│       │   │   ├── analytics-sync.worker.ts    ← per-platform metrics
│       │   │   ├── media-processor.worker.ts   ← resize, variants, EXIF strip
│       │   │   ├── report-generator.worker.ts  ← Puppeteer PDF, CSV
│       │   │   ├── email.worker.ts             ← React Email + Resend
│       │   │   ├── notification.worker.ts      ← push, in-app
│       │   │   ├── token-refresh.worker.ts     ← OAuth token renewal
│       │   │   ├── rss-importer.worker.ts
│       │   │   └── webhook-delivery.worker.ts
│       │   │
│       │   ├── guards/
│       │   │   ├── plan.guard.ts       ← resolves plan from DB on every request
│       │   │   ├── feature.guard.ts    ← @RequireFeature() decorator
│       │   │   ├── quota.guard.ts      ← post/account/seat/storage limits
│       │   │   └── api-key.guard.ts    ← public API authentication
│       │   │
│       │   ├── decorators/
│       │   │   ├── require-feature.ts
│       │   │   ├── require-plan.ts
│       │   │   └── current-user.ts
│       │   │
│       │   ├── crons/
│       │   │   ├── analytics-sync.cron.ts      ← per-platform cadence
│       │   │   ├── token-refresh.cron.ts       ← proactive OAuth renewal
│       │   │   ├── scheduled-posts.cron.ts     ← fire delayed BullMQ jobs
│       │   │   ├── monthly-reports.cron.ts     ← 1st of month report gen
│       │   │   ├── best-times.cron.ts          ← weekly engagement analysis
│       │   │   ├── competitor-sync.cron.ts     ← daily competitor metrics
│       │   │   ├── exchange-rates.cron.ts      ← hourly rate fetch
│       │   │   └── data-deletion.cron.ts       ← 30-day soft delete cleanup
│       │   │
│       │   ├── database/
│       │   │   ├── migrations/         ← versioned Prisma migrations
│       │   │   └── seeds/
│       │   │       ├── plans.seed.ts   ← 4 default plans
│       │   │       ├── brand.seed.ts   ← MyManager default brand config
│       │   │       └── platforms.seed.ts ← 10 platform rows
│       │   │
│       │   ├── common/
│       │   │   ├── filters/            ← global exception filter
│       │   │   ├── interceptors/       ← logging, transform response
│       │   │   ├── pipes/              ← Zod validation pipe
│       │   │   └── utils/
│       │   │
│       │   ├── app.module.ts
│       │   └── main.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma           ← single source of truth for DB schema
│       │   └── migrations/
│       │
│       ├── Dockerfile                  ← API server image
│       └── Dockerfile.worker           ← workers image (separate process)
│
├── packages/                           ← shared across all apps
│   ├── config/                         ← WHITE-LABEL source of truth
│   │   ├── index.ts                    ← exports BrandConfig type + loader
│   │   ├── schema.ts                   ← Zod schema for brand config
│   │   ├── defaults.ts                 ← MyManager fallback values
│   │   └── loader.ts                   ← fetches live config from API
│   │
│   ├── types/                          ← shared TypeScript types
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── post.ts                     ← Post, PostStatus, ContentType, Platform
│   │   ├── plan.ts
│   │   ├── analytics.ts
│   │   ├── project.ts
│   │   ├── brand.ts
│   │   ├── social.ts
│   │   └── platform-options.ts        ← per-platform post options (TikTok privacy, GBP type, etc.)
│   │
│   ├── ui/                             ← shared React components (web + admin)
│   │   ├── components/
│   │   │   ├── composer/
│   │   │   ├── previews/
│   │   │   ├── analytics/
│   │   │   ├── brand/                  ← BrandProvider, useBrand
│   │   │   └── plan/                   ← PlanGate (feature-gated wrapper)
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── platform-limits.ts          ← char limits, image specs per platform (reads from DB)
│   │   ├── caption-formatter.ts        ← truncate, inject mentions, UTM per platform
│   │   ├── content-type-validator.ts   ← validates media against platform specs
│   │   ├── hashtag-extractor.ts        ← multi-script regex
│   │   ├── date-helpers.ts
│   │   ├── currency.ts
│   │   └── slug.ts
│   │
│   ├── translations/                   ← i18n files
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── composer.json
│   │   │   ├── dashboard.json
│   │   │   ├── billing.json
│   │   │   ├── auth.json
│   │   │   ├── marketing.json
│   │   │   └── emails.json
│   │   ├── fr/
│   │   ├── sw/                         ← Swahili
│   │   ├── ar/                         ← Arabic (RTL)
│   │   ├── es/
│   │   └── pt/
│   │
│   ├── validators/                     ← Zod schemas (shared frontend + backend)
│   │   ├── post.schema.ts
│   │   ├── user.schema.ts
│   │   ├── plan.schema.ts
│   │   └── brand.schema.ts
│   │
│   ├── constants/
│   │   ├── platforms.ts                ← PLATFORMS enum, per-platform specs
│   │   ├── content-types.ts            ← ContentType enum
│   │   ├── roles.ts
│   │   └── error-codes.ts
│   │
│   ├── emails/                         ← React Email templates
│   │   ├── templates/
│   │   │   ├── welcome.tsx
│   │   │   ├── verify-email.tsx
│   │   │   ├── password-reset.tsx
│   │   │   ├── team-invite.tsx
│   │   │   ├── invoice.tsx
│   │   │   ├── payment-failed.tsx
│   │   │   ├── post-failed.tsx
│   │   │   ├── report-ready.tsx
│   │   │   ├── approval-needed.tsx
│   │   │   ├── revision-requested.tsx
│   │   │   ├── plan-renewing.tsx
│   │   │   └── social-token-expired.tsx
│   │   └── index.ts
│   │
│   └── seo/
│       ├── schema-builders.ts          ← JSON-LD: Organization, SoftwareApp, Offer, Blog...
│       ├── meta-builder.ts             ← Next.js Metadata object builder
│       └── og-builder.ts              ← Open Graph tag builder
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── .env.example                        ← all env vars documented, none defaulted
├── docker-compose.yml                  ← local dev: postgres, redis
└── .github/
    └── workflows/
        ├── ci.yml                      ← lint, type-check, test (all branches)
        ├── preview.yml                 ← Vercel preview deploy on every PR
        ├── deploy-web.yml              ← Vercel deploy web app (web + admin route group) on main
        ├── deploy-api.yml              ← Railway deploy on main
        └── eas-build.yml               ← mobile build on release tag
```

---

## 3. Content Types Per Platform

Every content type is a row in the `content_types` table. The `platforms` table references which content types each platform supports. The composer renders different fields based on which content types are selected.

### Content Types Enum

```
text_only          — plain text, no media
image_single       — one image
image_carousel     — multiple images (2+)
video_short        — vertical video ≤60s (Shorts/Reels/TikTok short)
video_long         — any video >60s (standard upload; TikTok supports up to 10min)
video_story        — vertical ephemeral video (Stories, 24h expiry)
image_story        — static vertical image (Stories, 24h expiry)
document           — PDF / slidedeck (LinkedIn)
gbp_update         — Google Business: What's New post
gbp_event          — Google Business: Event with date/time
gbp_offer          — Google Business: Offer/coupon
gbp_product        — Google Business: Product listing
pin_image          — Pinterest: static image Pin
pin_video          — Pinterest: video Pin
pin_product        — Pinterest: Product Pin with price
pin_idea           — Pinterest: multi-page Idea Pin (Phase 3 — not at launch)
whatsapp_broadcast — WhatsApp: message to opted-in contact list
whatsapp_channel   — WhatsApp: channel post
```

> **Note — post-level fields, not content types:**  
> `link_url` (VARCHAR, nullable) + `link_preview_override` (JSONB, nullable) — any post type can carry a URL with an optional OG preview override. Not a separate content type.  
> `first_comment_text` (VARCHAR, nullable) — first comment posted immediately after the main post publishes (Facebook + Instagram). Stored as a nullable column on the `posts` table, not as a content type.

### Per-Platform Content Type Matrix

| Platform | Supported Content Types | Count | Notes |
|---|---|---|---|
| **Facebook** | text_only, image_single, image_carousel, video_long, video_short, image_story, video_story | 7 + link_url field | Up to 10 images. Stories expire 24h. Reels via video_short. Link preview via post-level link_url field. |
| **Instagram** | image_single, image_carousel, video_short, image_story, video_story | 5 | No text-only posts. Business accounts required. **Story publishing via API has significant restrictions** — only specific Professional account types, no scheduling, one at a time. first_comment_text field supported. |
| **X / Twitter** | text_only, image_single, video_short | 3 + link_url field | Up to 4 images per post (image_single carries count). 280 char limit. GIF = image_single. Link preview via link_url field. |
| **LinkedIn** | text_only, image_single, image_carousel, video_long, document | 5 + link_url field | Document = PDF carousel (up to 300 pages). Up to 9 images. Link preview via link_url field. |
| **TikTok** | video_short, video_long, image_carousel | 3 | video_short ≤60s, video_long 61s–10min. Photo carousel 2–35 images. Business account required. |
| **Google Business** | gbp_update, gbp_event, gbp_offer, gbp_product | 4 | Always includes 1 optional image. No video. gbp_update posts expire after 7 days. |
| **Pinterest** | pin_image, pin_video, pin_product | 3 | pin_idea is Phase 3. Pins to a board (mandatory). 2:3 ratio recommended. |
| **YouTube** | video_long, video_short | 2 | video_short = YouTube Shorts (≤60s vertical, tagged #Shorts). Title + category stored in post_platform_options. |
| **WhatsApp** | whatsapp_broadcast, whatsapp_channel, image_single, video_short, document | 5 | Opted-in contacts only. Requires WABA verification from Meta. |
| **Threads** | text_only, image_single, image_carousel, video_short | 4 + link_url field | 500 char limit. Up to 20 items in carousel. Link preview via link_url field. |

### Composer Behaviour Per Content Type

When the user selects platforms in the composer, the intersection of their selected platforms' capabilities determines what is shown:

- If only platforms supporting `text_only` are selected → media upload is hidden
- If any platform requires media (Instagram) and no media is attached → that platform is flagged
- If a video exceeds a platform's `max_video_duration_seconds` → warning shown in that platform's preview
- If caption exceeds a platform's `max_caption_chars` → character count turns red for that platform only
- Platform-specific fields appear in an expandable section per platform (e.g. GBP post type selector, TikTok privacy setting, YouTube title/category, Pinterest board selector)

### Content Type Validation Rules (enforced server-side)

```typescript
// packages/utils/content-type-validator.ts
interface ContentValidation {
  platform: Platform;
  contentType: ContentType;
  mediaFiles: MediaFile[];
  caption: string;
  platformOptions: Record<string, unknown>;
}

// Validation checks per platform:
// - caption.length <= platform.max_caption_chars
// - mediaFiles.length <= platform.max_images
// - mediaFiles[].size_bytes <= platform.max_file_size_mb * 1024 * 1024
// - video.duration_seconds <= platform.max_video_duration_seconds
// - image.width >= platform.min_image_width (if defined)
// - image.aspect_ratio is in platform.allowed_ratios (if defined)
// - platform-specific: GBP requires post_type, YouTube requires title, Pinterest requires board_id
// - WhatsApp requires recipient_list_id
```

---

## 4. Platform Support Matrix

| Platform | Phase | API | Auth | Workers | Post Types | Analytics |
|---|---|---|---|---|---|---|
| Facebook | Launch | Graph API v21 | OAuth 2.0 (Meta) | facebook.worker.ts | 7 | Reach, impressions, likes, comments, shares, clicks |
| Instagram | Launch | Graph API v21 | OAuth 2.0 (Meta) | instagram.worker.ts | 5 | Reach, impressions, likes, comments, saves |
| X / Twitter | Launch | API v2 | OAuth 2.0 PKCE | x.worker.ts | 3 | Impressions, likes, retweets, replies, clicks |
| LinkedIn | Launch | UGC Posts API v2 | OAuth 2.0 | linkedin.worker.ts | 5 | Impressions, likes, comments, shares, clicks |
| TikTok | Launch | Content Posting API | OAuth 2.0 + app review | tiktok.worker.ts | 3 | Views, likes, comments, shares, play_duration |
| Google Business | Launch | My Business API v4.9 | OAuth 2.0 (Google) | google-business.worker.ts | 4 | Impressions per post |
| Pinterest | Phase 2 | API v5 | OAuth 2.0 | pinterest.worker.ts | 3 | Impressions, saves, outbound_clicks, engagements |
| YouTube | Phase 2 | Data API v3 + Analytics API | OAuth 2.0 (Google — same app as GBP) | youtube.worker.ts | 2 | Views, likes, comments, watch_time, avg_view_pct |
| WhatsApp | Phase 2 | Business Cloud API | System user token (Meta Business) | whatsapp.worker.ts | 5 | Delivered, read, failed per message |
| Threads | Phase 2 | Threads API (Meta) | Shared with Instagram OAuth (additional scopes) | threads.worker.ts | 4 | Views, likes, replies, reposts, quotes |

---

## 5. Database Tables

### Complete Table List (~60 tables)

#### Core Identity & Auth
```
users
user_preferences          ← language, currency, timezone, theme, 2FA
user_push_tokens          ← Expo push tokens per device
totp_backup_codes         ← 2FA recovery codes
sessions                  ← NextAuth sessions
accounts                  ← NextAuth OAuth accounts (Google, Apple sign-in)
```

#### Plans & Billing
```
plans                     ← all plan definitions: limits JSONB + features JSONB (no separate plan_features table)
subscriptions             ← user → plan mapping, Flutterwave subscription ID,
                            locked_limits JSONB (snapshot at subscribe time),
                            locked_features JSONB (snapshot at subscribe time)
subscription_items        ← seat-level billing items (Enterprise)
billing_history           ← invoice records
plan_overrides            ← superadmin manual plan assignments (override_until, reason, admin_id)
sales_leads               ← contact sales form submissions
```

#### Workspaces & Teams
```
workspaces
workspace_members         ← user ↔ workspace with role (owner/admin/member)
workspace_approval_config ← approval flow settings per workspace
workspace_brand_configs   ← Level 2 white-label (agency brand)
```

#### Projects (Enterprise)
```
projects                  ← client projects under a workspace
project_members           ← user ↔ project assignment
project_brand_configs     ← Level 3 white-label (client brand)
portal_access_tokens      ← signed client portal URLs
portal_actions            ← audit log of all portal interactions
```

#### Platforms
```
platforms                 ← all 10 platform definitions (limits, capabilities, phase)
content_types             ← all 20 content type definitions
platform_content_types    ← which platforms support which content types
social_accounts           ← connected OAuth accounts per workspace
platform_board_cache      ← Pinterest boards cache
whatsapp_contact_lists    ← opted-in contact lists per workspace
```

#### Posts & Content
```
posts                     ← core post record
                            + link_url VARCHAR nullable
                            + link_preview_override JSONB nullable
                            + first_comment_text VARCHAR nullable (Facebook + Instagram)
post_platform_results     ← per-platform publish result (ID, URL, error)
post_versions             ← auto-save history (last 10 per post)
post_platform_options     ← JSONB keyed by platform slug:
                            {"tiktok": {"privacy": "PUBLIC", "allow_duet": true},
                             "youtube": {"title": "...", "category_id": 22},
                             "gbp": {"post_type": "EVENT", "event_start": "..."},
                             "pinterest": {"board_id": "..."}}
post_media                ← post ↔ media_asset junction
hashtags                  ← master hashtag list: (id, text, workspace_id, platform)
post_hashtags             ← post ↔ hashtag junction (FK → hashtags)
post_templates            ← reusable post templates
recurrence_plans          ← recurring post schedule config
post_comments             ← inline caption comments (approval flow)
approval_events           ← state transition audit trail
```

#### Campaigns
```
campaigns                 ← campaign metadata
campaign_posts            ← post ↔ campaign junction
```

#### Media
```
media_assets              ← all uploaded files (R2 keys, dimensions, variants)
```

#### Analytics
```
post_analytics            ← per-platform metrics per post (synced every 6h)
workspace_analytics_daily ← aggregated daily totals per workspace per platform
best_times                ← optimal posting times per workspace per platform
hashtag_sets              ← pre-saved hashtag groups
```

#### Notifications
```
notifications             ← all notification records
notification_preferences  ← per-user per-event-type per-channel toggles
```

#### Reports
```
reports                   ← generated report records
report_configs            ← saved report configurations and schedules
```

#### White-label & Brand
```
brand_configs             ← platform-level white-label config (single row)
```

#### Multilingual & Currency
```
currencies                ← supported currencies with rounding rules
exchange_rates            ← hourly rate snapshots
translations              ← overridden translation strings (admin-editable)
```

#### AI Features
```
ai_credit_usage           ← per-user AI credit consumption tracking
```

#### UTM Tracking
```
utm_configs               ← per-workspace per-platform UTM defaults
```

#### Comment Inbox
```
social_comments           ← fetched comments from all platforms
comment_assignments       ← comment → team member assignment
```

#### Link in Bio
```
bio_pages                 ← bio page config per workspace/project
bio_link_events           ← click tracking per link per day
```

#### RSS
```
rss_feeds                 ← connected RSS feed URLs
rss_imported_items        ← deduplication log of imported feed items
```

#### Social Listening
```
listening_terms           ← brand monitoring search terms
mention_events            ← raw mention records from all platforms
mention_analytics_daily   ← aggregated daily mention stats
```

#### Competitor Benchmarking
```
competitor_profiles       ← tracked competitor accounts per platform
competitor_snapshots      ← daily metrics snapshots
```

#### Webhooks & Public API
```
webhook_endpoints         ← configured outgoing webhook URLs
webhook_deliveries        ← delivery log with retry tracking
api_keys                  ← bcrypt-hashed API keys for public API
                            (rate limit counters live in Redis — no DB table needed)
```

#### GDPR & Compliance
```
data_export_requests      ← user data export job records
deletion_requests         ← account deletion requests + soft-delete state
cookie_consents           ← per-user consent records
user_email_preferences    ← email unsubscribe settings per type
```

#### Audit
```
audit_logs                ← append-only, immutable, all significant actions
```

---

## 6. API Architecture

### NestJS Module Structure

Every module follows the same pattern:
```
modules/posts/
├── posts.module.ts
├── posts.controller.ts     ← REST endpoints, guards applied here
├── posts.service.ts        ← business logic
├── posts.repository.ts     ← Prisma queries
├── dto/
│   ├── create-post.dto.ts  ← Zod-validated input
│   └── update-post.dto.ts
└── posts.types.ts          ← module-specific types
```

### Guard Execution Order (every authenticated request)

```
Request → JwtGuard → PlanGuard → FeatureGuard → QuotaGuard → Controller
```

1. **JwtGuard** — validates token, resolves user from DB (not JWT payload — prevents stale roles)
2. **PlanGuard** — resolves current plan from `subscriptions` table, checks Flutterwave subscription status, attaches `req.plan`
3. **FeatureGuard** — checks `req.plan.features[featureName]` for `@RequireFeature()` decorated routes
4. **QuotaGuard** — live count check against plan limits for write operations

### Plan Guard — source of truth logic

```typescript
// Never trust JWT for plan — always read from DB
// Priority: manual override → Flutterwave subscription → free fallback
async resolvePlan(userId: string): Promise<PlanWithLimits> {
  const override = await this.getActiveOverride(userId);
  if (override && (!override.override_until || override.override_until > new Date())) {
    return this.plansService.getById(override.plan_id);
  }
  const subscription = await this.getActiveSubscription(userId);
  if (!subscription || subscription.status !== 'active') {
    return this.plansService.getBySlug('free');
  }
  // Use locked_limits (snapshot at subscription time) not current plan definition
  return subscription.locked_limits;
}
```

### API Versioning

All endpoints versioned: `/api/v1/...`  
Public API (API-key auth): `/v1/...`  
Internal/admin: `/api/admin/...`

### Rate Limiting (all endpoints)

- Authenticated: 500 req/min per user (tracked in Redis)
- Unauthenticated: 30 req/min per IP
- Public API: configurable per plan in `plans.rate_limit_per_hour`
- Portal endpoints: 60 req/min per token
- Headers always returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 7. Worker Architecture

### BullMQ Queue Map

```
publishing-facebook        ← immediate + delayed jobs
publishing-instagram
publishing-x
publishing-linkedin
publishing-tiktok          ← 3-step: init → upload → poll
publishing-google-business
publishing-pinterest
publishing-youtube         ← resumable upload
publishing-whatsapp
publishing-threads
analytics-sync             ← per-platform metrics fetch
media-processing           ← resize, variants, EXIF strip
report-generation          ← Puppeteer PDF, CSV
email-delivery             ← React Email + Resend
push-notifications         ← Expo Push API
token-refresh              ← proactive OAuth renewal
rss-import                 ← feed polling
webhook-delivery           ← outgoing webhooks with retry
data-deletion              ← GDPR hard delete jobs
```

### Worker Retry Policy (per queue)

| Event | Retries | Backoff |
|---|---|---|
| Post failed (network) | 5 | Exponential: 1m, 5m, 30m, 2h, 6h |
| Post failed (API error 5xx) | 3 | Fixed: 5m each |
| Post failed (API error 4xx — user error) | 0 | No retry — notify user immediately |
| Analytics sync failed | 3 | Fixed: 15m each |
| Webhook delivery failed | 6 | Exponential |
| Email delivery failed | 3 | Fixed: 5m each |

### Publishing Worker Base Pattern

```typescript
// All platform workers extend this
abstract class BasePublishingWorker {
  abstract buildPayload(post: Post, account: SocialAccount): Promise<PlatformPayload>;
  abstract publish(payload: PlatformPayload, token: string): Promise<PlatformResult>;
  abstract fetchPostId(result: PlatformResult): string;

  async process(job: Job<PublishJobData>): Promise<void> {
    const { postId, platform, socialAccountId } = job.data;
    const post = await this.postsRepo.findById(postId);
    const account = await this.socialAccountsRepo.findById(socialAccountId);
    const token = await this.tokenService.getDecryptedToken(account);

    await this.postsRepo.updatePlatformStatus(postId, platform, 'publishing');

    try {
      const payload = await this.buildPayload(post, account);
      const result = await this.publish(payload, token);
      const platformPostId = this.fetchPostId(result);

      await this.postsRepo.updatePlatformStatus(postId, platform, 'published', platformPostId);
      await this.auditService.log('post.published', { postId, platform, platformPostId });
      this.socketGateway.emit(post.userId, 'post:status', { postId, platform, status: 'published' });
    } catch (error) {
      await this.postsRepo.updatePlatformStatus(postId, platform, 'failed', null, error.message);
      this.socketGateway.emit(post.userId, 'post:status', { postId, platform, status: 'failed', error: error.message });
      this.notificationService.notify(post.userId, 'post_failed', { postId, platform, reason: error.message });
      throw error; // BullMQ handles retry
    }
  }
}
```

---

## 8. Feature Specifications

### Feature → Plan Mapping

| Feature | Free | Starter | Pro | Enterprise | Custom |
|---|---|---|---|---|---|
| Posts per month | 4 | 30 | 200 | 500 | Negotiated |
| Connected accounts | 2 | 3 | 6 | 20 | Negotiated |
| Analytics window | 7 days | 30 days | 90 days | 365 days | Full history |
| Team members | 1 | 1 | 1 | 5 (+ $15/extra) | Negotiated |
| Projects | 0 | 0 | 0 | 10 | Negotiated |
| Max scheduled queue | 0 | 50 | 200 | 500 | Negotiated |
| Media storage (GB) | 0.5 | 2 | 10 | 50 | Negotiated |
| AI caption credits | 0 | 20 | 100 | 500 | Negotiated |
| Scheduling | ✗ | ✓ | ✓ | ✓ | ✓ |
| Platform previews | ✗ | ✓ | ✓ | ✓ | ✓ |
| @ Mention tagging | ✗ | ✗ | ✓ | ✓ | ✓ |
| Best time suggestions | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approval workflows | ✗ | ✗ | ✗ | ✓ | ✓ |
| White-label PDF reports | ✗ | ✗ | ✗ | ✓ | ✓ |
| Bulk CSV scheduling | ✗ | ✗ | ✗ | ✓ | ✓ |
| Client portal | ✗ | ✗ | ✗ | ✓ | ✓ |
| Client invoicing | ✗ | ✗ | ✗ | ✓ | ✓ |
| Webhooks | ✗ | ✗ | ✗ | ✓ | ✓ |
| API access | ✗ | ✗ | ✗ | ✗ | ✓ |
| Custom domain (bio) | ✗ | ✗ | ✓ | ✓ | ✓ |
| White-label app | ✗ | ✗ | ✗ | ✗ | ✓ |
| SLA guarantee | ✗ | ✗ | ✗ | ✗ | ✓ |
| Rate limit (API req/hr) | — | — | — | — | Per plan |

All limits enforced server-side in PostgreSQL + Redis. No frontend-only gating.

---

## 9. White-Label System

### Three-Level Architecture

**Level 1 — Platform** (superadmin): App name, logo, domain, all colors, all copy, SEO, emails. Stored in `brand_configs` table. Served from `GET /api/brand` (Cloudflare edge-cached, 1h TTL). Changes are live within seconds after cache purge.

**Level 2 — Agency workspace** (Enterprise): Agency's own brand shown on portfolio reports and internal workspace. Stored in `workspace_brand_configs`.

**Level 3 — Client/project** (Enterprise per-project): Client branding on their reports and client portal. Stored in `project_brand_configs`. Client never sees MyManager or the agency's name unless `show_agency_logo: true`.

### BrandConfig Schema

```typescript
interface BrandConfig {
  identity: {
    app_name: string;
    app_tagline: string;
    app_description: string;
    logo_url: string;
    logo_dark_url: string;
    favicon_url: string;
    icon_512_url: string;  // PWA icon
  };
  theme: {
    primary_color: string;   // CSS hex
    primary_dark: string;
    accent_color: string;
    font_heading: string;
    font_body: string;
    border_radius: string;
  };
  contact: {
    support_email: string;
    sales_email: string;
    website_url: string;
    twitter_handle: string;
    company_name: string;
    company_address: string;
  };
  legal: {
    copyright_owner: string;
    copyright_year_start: number;  // footer: "© {start}–{current_year} {owner}"
    privacy_policy_url: string;
    terms_url: string;
  };
  seo: {
    default_title: string;
    title_suffix: string;
    default_description: string;
    og_image_url: string;
    twitter_site: string;
    google_analytics_id: string;
    google_tag_manager: string;
  };
  features: {
    show_blog: boolean;
    show_affiliate: boolean;
    maintenance_mode: boolean;
    registration_open: boolean;
  };
}
```

### Theme Injection

Root `layout.tsx` server-renders CSS variables into `<html>`:
```html
<html style="--brand-primary: #7F77DD; --brand-accent: #1D9E75; --brand-font-heading: Inter;">
```
Tailwind classes never hardcode colors — they reference CSS variables. Change primary color in admin → every button, link, and accent updates immediately everywhere.

---

## 10. Multilingual & Multicurrency

### Language Detection Priority

1. User's saved preference (DB `user_preferences.language`, `lang_source = 'user'`)
2. Device/browser language (`navigator.language` / `Accept-Language` header)
3. Country from IP (`CF-IPCountry` Cloudflare header → ISO country → language mapping)
4. English fallback

### Launch Languages (Phase 1)

| Language | Code | Direction | Markets |
|---|---|---|---|
| English | en | LTR | Source language, global fallback |
| French | fr | LTR | France, DRC, Senegal, Cameroon, Belgium |
| Swahili | sw | LTR | Kenya, Tanzania, Uganda, Rwanda |
| Arabic | ar | RTL | Egypt, UAE, Saudi Arabia, Morocco |
| Spanish | es | LTR | Spain, Latin America |
| Portuguese | pt | LTR | Brazil, Portugal, Angola, Mozambique |

RTL handling: `<html dir="rtl" lang="ar">` + Tailwind RTL variants (`rtl:flex-row-reverse`, `rtl:text-right`). Mobile: `I18nManager.forceRTL(true)`.

### Translation Pipeline

Source (en) → `next-intl extract` (CI enforces no missing keys) → DeepL/Google Translate API (machine draft) → Admin translation editor (human review + approve) → Live push via `GET /api/translations/:lang/:namespace` (Cloudflare cached, 1h TTL, invalidated on save).

### Currency System

- All prices stored internally in USD
- Hourly exchange rate sync via Open Exchange Rates API → Redis (1h TTL) → PostgreSQL backup
- Display conversion at render time, never at transaction time
- Subscription currency locked at signup → renewals charge same amount in same currency
- Rounding rules per currency stored in `currencies` table (UGX: nearest 100, JPY: nearest 10, etc.)

---

## 11. Billing & Plans

### Plan Definitions (stored in DB, adjustable by superadmin)

| | Free | Starter | Pro | Enterprise | Custom |
|---|---|---|---|---|---|
| Price/mo | $0 | $9 | $19 | $79 base | Negotiated |
| Price/mo (annual) | — | $7 | $15 | $63 base | Negotiated |
| Seat price | — | — | — | $15/extra seat | Negotiated |
| Posts/mo | 4 | 30 | 200 | 500 | Negotiated |
| Accounts | 2 | 3 | 6 | 20 | Negotiated |
| Seats | 1 | 1 | 1 | 5 included | Negotiated |
| Projects | 0 | 0 | 0 | 10 | Negotiated |
| Analytics | 7d | 30d | 90d | 365d | All |
| Storage | 0.5GB | 2GB | 10GB | 50GB | Negotiated |
| AI credits | 0 | 20 | 100 | 500 | Negotiated |

### Flutterwave Integration

Payment methods accepted in Uganda (and globally):
- MTN MoMo (USSD push, no app needed)
- Airtel Money (USSD push)
- Visa / Mastercard (local + international)
- Google Pay (Android)
- Apple Pay (iPhone/Safari)
- Bank transfer (virtual account)

All plans use Flutterwave's Recurring Billing API. Webhooks: `charge.completed`, `subscription.cancelled`, `subscription.payment_failed`.

### Billing Flow

```
User selects plan → Flutterwave checkout (modal, no page redirect)
→ charge.completed webhook → subscription row created
→ locked_limits snapshot taken at plan current values
→ plan activates immediately → Socket.io pushes 'plan:activated' to user session
```

### Enforcement Architecture (6 layers)

1. **PlanGuard** — resolves plan from DB on every authenticated API request
2. **FeatureGuard** — `@RequireFeature('scheduling')` on every protected endpoint
3. **QuotaGuard** — live DB count vs plan limit before every write
4. **Flutterwave webhook sync** — subscription status updated within seconds of payment events
5. **Superadmin override system** — manual plan assignment with `override_until` expiry
6. **Plan definition hot-reload** — plans cached in Redis with 60s TTL, invalidated on admin save

---

## 12. Security Model

### Authentication

- **Session**: JWT access token (15min) + refresh token (30 days, rotated on use, stored in httpOnly cookie)
- **OAuth**: NextAuth.js v5 handles Google + Apple sign-in. Platform OAuth (social account connection) handled by Passport.js strategies in NestJS.
- **2FA**: TOTP (RFC 6238, compatible with Authenticator apps). Secret AES-256 encrypted at rest. 10 single-use backup codes.

### Token Storage

- OAuth access/refresh tokens AES-256 encrypted before DB storage
- Encryption key stored in environment variable, never in code
- Token decryption happens only in the publishing worker at post time
- Tokens never exposed via API responses

### Platform OAuth Security

- State parameter: 32-byte cryptographically random, stored in Redis with 10-minute TTL
- Validates on callback to prevent CSRF
- Redirect URI strictly validated against allowlist

### API Security

- All endpoints require auth (public marketing pages excluded)
- CORS: whitelist of known origins only
- Rate limiting: Redis-backed per-user and per-IP
- Input validation: Zod on every DTO, NestJS ValidationPipe globally
- SQL injection: Prisma parameterized queries (no raw SQL except in migrations)
- Webhook signature: HMAC-SHA256 on all outgoing webhooks + Flutterwave incoming webhook signature verification
- CSP headers set by Next.js middleware

### Data Isolation

- PostgreSQL Row-Level Security for multi-tenant workspace isolation
- Every DB query includes `workspace_id` filter in Prisma `where` clause
- Middleware validates user → workspace membership before any data access
- Audit log is append-only (no DELETE, no UPDATE on audit_logs table — enforced via DB constraint)

---

## 13. Deployment Architecture

```
                    ┌─────────────────────────────────┐
                    │         Cloudflare               │
                    │  CDN · DNS · DDoS · CF-IPCountry │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼────────┐  ┌───────▼──────────┐  ┌──────▼──────────┐
    │   Vercel          │  │   Vercel          │  │   Cloudflare R2  │
    │   web app         │  │   admin app       │  │   Media storage  │
    │   app.{domain}    │  │   admin.{domain}  │  │   reports/       │
    └─────────┬────────┘  └───────┬──────────┘  └─────────────────┘
              │                    │
              └─────────┬──────────┘
                        │ HTTPS
              ┌─────────▼────────────────────────────┐
              │            Railway                    │
              │  ┌─────────────┐  ┌───────────────┐  │
              │  │  NestJS API  │  │  BullMQ       │  │
              │  │  api.{dom}   │  │  Workers      │  │
              │  └──────┬──────┘  └───────┬───────┘  │
              │         │                 │           │
              │  ┌──────▼──────┐  ┌───────▼───────┐  │
              │  │ PostgreSQL  │  │    Redis       │  │
              │  │ (managed)   │  │  (managed)     │  │
              │  └─────────────┘  └───────────────┘  │
              └──────────────────────────────────────┘

Mobile apps:
  EAS Build → App Store (iOS) + Play Store (Android)
  OTA updates via Expo (JS bundle only, no app store re-review)
```

### Environment Variables (never defaulted in code)

```bash
# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Social OAuth credentials
# Facebook + Instagram + WhatsApp + Threads: one Meta app, multiple permissions
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
# Instagram uses the same FACEBOOK_APP_ID / FACEBOOK_APP_SECRET
# WhatsApp Business (additional Meta Business credentials)
WHATSAPP_SYSTEM_USER_TOKEN=        # permanent system user token from Meta Business Manager
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
# Threads uses the same FACEBOOK_APP_ID / FACEBOOK_APP_SECRET + additional scopes

# X / Twitter
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# Google (used for: Google Sign-In + Google Business Profile + YouTube — one OAuth app)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Pinterest
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

# Payments
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_WEBHOOK_HASH=          # Flutterwave secret hash for webhook signature verification

# Storage
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=

# Email
RESEND_API_KEY=

# AI
ANTHROPIC_API_KEY=                 # Claude API (captions, image analysis, content insights)
REPLICATE_API_KEY=                 # Stable Diffusion (AI image generation)
OPENAI_API_KEY=                    # Whisper only (video auto-captions)

# Self-hosted tools
LANGUAGETOOL_URL=                  # e.g. http://languagetool:8010 (Docker service)

# Analytics & monitoring
GOOGLE_ANALYTICS_PROPERTY_ID=     # optional — for deep GA4 integration
POSTHOG_API_KEY=                   # PostHog product analytics
SENTRY_DSN=                        # runtime error tracking (all apps)
SENTRY_AUTH_TOKEN=                 # CI only — for source map uploads to Sentry

# Token encryption (NEVER commit this value)
ENCRYPTION_KEY=                    # 32-byte hex key for AES-256 OAuth token encryption

# Exchange rates
OPEN_EXCHANGE_RATES_API_KEY=

# Mobile (CI/CD secret — not a runtime secret)
EXPO_TOKEN=                        # EAS CLI authentication in GitHub Actions

# Deployment (CI/CD secrets only — not runtime)
RAILWAY_TOKEN=                     # Railway CLI authentication in GitHub Actions
VERCEL_TOKEN=                      # Vercel CLI authentication in GitHub Actions
DOCKER_REGISTRY=                   # container registry URL for worker images
DOCKER_USERNAME=
DOCKER_PASSWORD=
```

---

## 14. CI/CD Pipeline

### GitHub Actions Workflows

**ci.yml** (every push to any branch):
```
pnpm install → turbo run lint → turbo run type-check → turbo run test
```

**deploy-web.yml** (push to main):
```
ci passes → Vercel deploy web app (includes admin route group at /admin/*)
→ run DB migrations via Prisma
```

**deploy-api.yml** (push to main):
```
ci passes → docker build API image → docker build worker image
→ push to registry → Railway deploy API → Railway deploy workers
→ run Prisma migrations → smoke test: GET /health
```

**eas-build.yml** (git tag v*.*.*):
```
EAS build iOS (TestFlight) → EAS build Android (Play Internal)
→ on approval: submit to App Store + Play Store production
```

**preview.yml** (every PR):
```
ci → Vercel preview deploy → comment PR with preview URL
```

---

## 15. Build Phases & Timeline

### Phase 0 — Foundation (Weeks 1–3)
Database schema + auth + brand config + monorepo setup + Railway/Vercel/Cloudflare R2 configured + GitHub Actions CI

### Phase 1 — Core posting engine (Weeks 4–8)
Social OAuth (Facebook, Instagram, X, LinkedIn, TikTok, GBP) + Composer UI + Platform previews (all 6 launch platforms) + BullMQ workers + Post feed + Draft auto-save + Media upload + Scheduling + In-app notifications + Audit log

### Phase 2 — Billing + Plans (Weeks 9–11)
Flutterwave integration + Plan enforcement (all 6 layers) + Onboarding flow + Email system + Plan upgrade/downgrade

### Phase 3 — Enterprise features (Weeks 12–16)
Teams + Projects + Approval state machine + Client portal + Per-project brand config + Enterprise dashboard + Company analytics

### Phase 4 — Reports + Analytics (Weeks 17–20)
Analytics sync cron + Post performance detail + Per-platform breakdown + PDF report generator + CSV export + Scheduled reports + Hashtag tracker + Best times + UTM tracking

### Phase 5 — High priority features (Weeks 21–26)
Templates + Recurring posts + Bulk actions + 2FA + GDPR + Media library UI + Multilingual + Multicurrency + Mobile app (Expo, built in parallel from Week 15)

### Phase 6 — Phase 2 platforms + Growth (Weeks 27–36)
Pinterest + YouTube + WhatsApp + Threads workers + AI caption assistant + Comment inbox + Link in bio + RSS + Webhooks + Public API + Competitor benchmarking + Campaign management

**MVP (Phases 0–2): ~11 weeks.** Covers Free, Starter, Pro plans with core posting and billing.  
**Full feature parity: ~36 weeks (~9 months).**

---

## 16. Naming & Code Conventions

### Files & Folders
- Folders: `kebab-case` always (e.g. `social-accounts/`, `brand-editor/`)
- React components: `PascalCase.tsx` (e.g. `PostComposer.tsx`)
- Utilities/hooks/services: `camelCase.ts` (e.g. `useBrand.ts`, `flutterwaveService.ts`)
- Hooks always prefixed `use`. Services always suffixed `Service`.

### NestJS Modules
`auth.module.ts`, `auth.service.ts`, `auth.controller.ts` — always in folder named after module. DTOs in `dto/` subfolder.

### Database
- Tables: `snake_case` plural (e.g. `social_accounts`, `plan_subscriptions`)
- Foreign keys: `{table_singular}_id` (e.g. `user_id`, `workspace_id`)
- Prisma model names: PascalCase singular (Prisma maps to snake_case tables)

### Environment Variables
`SCREAMING_SNAKE_CASE`. All documented in `.env.example`. No defaults in code — missing var throws at startup with descriptive error.

### "MyManager" in codebase
Only in two places: `packages/config/defaults.ts` and `apps/api/prisma/seeds/brand.seed.ts`. Never in component files, email templates, or marketing copy. Every surface reads from `BrandConfig`.
