# Project Context
Last updated: 2026-07-21

## Current task
No open PR — work now lands **directly on `main`**. GitHub Actions has been
removed entirely (see decision below), so there is no CI gate; verify locally
before pushing.

Most recent work (this session): fixed a dark-mode white-on-white regression in
the auth cards and stood up Playwright E2E to guard it (PR #10, merged), then
removed all GitHub Actions workflows.

## Stack
Turborepo + pnpm 9.15.4 workspaces.
- `apps/api` — NestJS 10, Prisma 6, PostgreSQL 16, Redis 7, BullMQ (43 modules)
- `apps/web` — Next.js 15 App Router, React 19, Tailwind 4, Zustand, React Query
- `apps/mobile` — Expo SDK 53
- `apps/extension` — browser extension (minimal)
- `packages/` — config, constants, emails, seo, translations, types, utils, validators
- External: Cloudflare R2, Resend, Flutterwave, Anthropic, Replicate, Sentry, PostHog
- Deploy: **manual** (Railway API / Vercel web / EAS mobile), no hosted CI/CD

## Local verification (replaces CI)
- `pnpm type-check` — 4/4 workspaces
- `pnpm test` — API + web node suites
- `pnpm --filter @mymanager/web test:e2e` — Playwright (auto-starts dev server)
- `pnpm build` — pin is `NODE_ENV=production next build`; builds 3/3 tasks

## Recent decisions
- **2026-07-21** — **Removed all GitHub Actions workflows** (ci, preview,
  deploy-api, deploy-web, eas-build). The Actions account is billing-locked, so
  every run failed before starting and blocked PRs. Team commits directly to
  `main` and deploys manually. Recoverable via `git checkout 8a1f6eb -- .github/workflows`
  if billing is ever restored.
- **2026-07-21** — Auth-card surfaces (AuthShell, superadmin login) must use
  theme tokens (`var(--color-bg-card)` / `color-mix`), never hardcoded white.
  Hardcoded white + token-driven text = invisible white-on-white in dark mode.
  Guarded by a contrast E2E test (asserts ≥3:1), not brittle pixel-diffing.
- **2026-07-20** — Full 6-dimension audit at `docs/audit-2026-07-20.md`.
- **2026-07-20** — Retracted the readme's PostgreSQL RLS claim; never implemented
  (no `CREATE POLICY`, `setWorkspaceContext()` unwired, app connects as schema
  owner). Documented-but-absent controls treated as a security defect.
- **2026-07-20** — Tenancy fix is repository-level: `workspace_id` in every
  `where` clause, not just guard route-prefix lists (which rot on new modules).

## Merged since PR #1 (all on `main`)
- PR #1 — Phase 0/1 critical security (payment/tenancy bypass, decimal money,
  atomic registration, unified crypto, health checks, env validation)
- PR #2 — bio-pages public access without leaking drafts
- PR #5 — color tokenization: 1,518 hardcoded colors → semantic tokens, WCAG fix
- PR #7 — 156 card `<div>`s → `<Card>`, border-conflict fixes
- PR #8 — shared validators adopted in auth forms + API parity test
- (direct) — publishing fix: 9/10 platform workers read camelCase off snake_case
  Prisma rows; +65 pipeline tests
- PR #10 — dark-mode auth card fix + Playwright E2E infra

## Known issues (open — full detail in `docs/audit-2026-07-20.md`)
**HIGH — both RESOLVED 2026-07-21 (commit 3e7f803)**
- ~~Puppeteer per-PDF Chromium~~ → pooled (`browser-pool.ts`), plus hardened
  two concurrency bugs (launch-race overshoot, stranded waiter).
- ~~Dead `RefreshToken` model / `Session` doubling as token store~~ → refresh
  tokens migrated to `refresh_tokens` with rotation + **reuse detection**
  (replay → revoke whole family). `Session` model + `sessions` table dropped
  (migration `20260721000000`). NOTE: deploy logs out active API refresh
  sessions once.

**MEDIUM**
- Analytics aggregated in Node memory, not SQL.
- 4 unregistered guards (`api-key`, `feature`, `plan`, `quota`) — no plan-tier or
  quota enforcement at the HTTP layer.
- Web: many pages lack `error.tsx`, raw `fetch()` calls bypass the API client,
  `any` types, and `packages/ui` still doesn't exist (web components unshared).

**Unverified**
- Whether the web composer converts local→UTC correctly before sending
  `scheduled_at`. API side is correct (`timestamptz` in UTC); needs a frontend check.

## Next steps
1. Continue Phase 2 durables: SQL analytics aggregation, extract `packages/ui`,
   broaden validator adoption beyond auth forms.
2. Test coverage: now 26 API suites / 272 tests. OAuth flows, scheduling still
   thin. Extend the E2E harness to more critical flows (login submit, signup,
   checkout).
3. MEDIUM audit items: analytics-in-memory → SQL, register the 4 unused guards
   (plan/quota enforcement at HTTP layer), web `error.tsx`/API-client cleanup.

## ESLint (fixed 2026-07-21)
`pnpm lint` works again. The API's `import/no-unused-modules` rule was removed:
it's broken under ESLint 9 flat config and misreported DI-wired providers as
unused (300+ false positives). API now lints clean (0 problems); web has 2
pre-existing benign warnings.

## Active branches
- `main`: stable, all work lands here directly
