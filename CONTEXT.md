# Project Context
Last updated: 2026-07-22

## Current task — live full-stack audit: USER + SUPERADMIN SWEEPS COMPLETE (2026-07-22)
Live-tested every user-facing AND superadmin page. All user pages + all
fixable superadmin pages render clean (only the cosmetic `icon-192.png` 404
remains). Everything committed to `main`; working tree clean.

**Superadmin sweep (2026-07-22, commit 7d2ef80).** Fixed: credentials 429 (10
parallel system-config calls → 1); stock-images 500 (decrypt threw on plaintext
config → tolerant now); billing/leads 404+crash (`/admin/sales-leads` →
`/sales-leads` + asArray); settings brand 404+crash (read `/cms/brand`, feature
flags normalised from real BrandConfig fields). Hardened workspaces/overrides/
plans list parsing with asArray. **Clean superadmin pages:** dashboard, users,
plans, queue, api-health, audit, seo, brand, content/{pages,blog,faq,leads,legal,
nav-links,newsletter,testimonials}, settings/{theme,credentials,stock-images},
billing/leads, settings.

**Superadmin — the 5 missing endpoints are now BUILT (2026-07-22, commit 8a3132e).**
All render clean with real data; no frontend changes were needed (the pages
already called these paths):
- `GET /admin/workspaces` — WorkspacesService.listAllForAdmin.
- `GET /admin/billing` — BillingService.getAdminBillingOverview (MRR, subs,
  per-plan revenue, recent transactions).
- `GET/POST /admin/billing/overrides` — new **BillingOverride** model (the page's
  workspace-discount shape didn't fit user-scoped PlanOverride).
- `GET/POST/PATCH/DELETE /admin/email-templates` — new **EmailTemplate** model.
- `GET/PATCH /admin/translations` — pivots per-locale Translation rows into
  key-groups (group id = base64url(namespace+key)).
Migration `20260722082153_add_billing_overrides_and_email_templates`. Writes are
CSRF-protected (frontend apiClient handles it). Verified: email-template create
persists through the UI.

**Superadmin minor/known issues still open:**
- Middleware gates `/superadmin/login` itself (bounces logged-out users to `/login`).
- `/superadmin/settings/theme` has a generic `<title>`.
- **CKEditor** (email-template body editor) throws `license-key-missing` — the
  rich-text Visual editor needs a CKEditor license key set; body saves empty
  until then. Pre-existing, unrelated to the endpoint work.

## Prior: USER-PAGE SWEEP COMPLETE (2026-07-22)
Live-tested every user-facing dashboard page as the demo user. **All 15 pages
now render clean** — the only console noise left anywhere is the cosmetic
`icon-192.png` 404.

**Pages swept & confirmed clean (2026-07-22):** home, analytics, calendar,
compose, drafts, projects, campaigns, templates, media, team, reports,
conversations, settings, approvals, bio.

**Bugs found & fixed this session (commits 85a9131, cbc3294, 9404620):**
- **Systemic API 500** — 11 list endpoints (approvals, campaigns, reports,
  templates, newsletter, publishing, webhooks, listening, sales-leads, rss,
  comments) 500'd when called with no `page`/`limit` (exactly how the web calls
  them). TS default params + `ValidationPipe({transform,enableImplicitConversion})`
  → absent param coerced to `NaN` → Prisma `skip:NaN,take:NaN`. Fixed with the
  codebase-standard `DefaultValuePipe+ParseIntPipe`. (This is the same
  `skip:NaN` class as the earlier `/admin/leads` fix — now swept API-wide.)
- **Systemic web crash** — dashboards read arrays with `(data?.key||data||[])`
  but the API returns them under `.data` (or bare). The wrong-key fallback hit
  `.map`/`.slice` on the wrapper object → TypeError → error boundary (white
  screen on /home, /drafts; empty widgets elsewhere). Added `lib/utils/as-array.ts`
  and applied across 13 page components.
- **Media 400** — web sent `per_page`, API DTO whitelists `limit`
  (`forbidNonWhitelisted`). Aligned to `limit`; moved unsupported `search` to
  client-side filtering.
- **Settings 404** — `GET/PUT /users/preferences` 404'd for any user without a
  preferences row (fresh signups). Repo now upserts a defaults row.

**Still to check (deferred):** `icon-192.png` 404 (cosmetic, all pages — add the
asset or drop the manifest ref); theme page generic `<title>`; dead seed files
(`demo/superadmin/dashboard-data.seed.ts` — unused, divergent); superadmin-side
page sweep (only user pages done this pass).

**Verified this session:** apiClient already single-flights token refresh
(`lib/api/client.ts:65-89`) — the 401/429 storms seen on reload are stale-session
decay + endpoint throttle from repeated unauthenticated navigations, NOT a live
stampede bug. Login/signup submit smoke test PASSED (fresh login → clean /home).

### How to bring the stack back up (resume)
```
docker compose up -d postgres redis            # env: root .env has NEXTAUTH_SECRET
cd apps/api && npx prisma migrate deploy && SUPERADMIN_PASSWORD=Superadmin123 npx prisma db seed
pnpm --filter @mymanager/api dev               # API :3001 (nest watch)
cd apps/web && DISABLE_HTTPS_UPGRADE=1 NEXTAUTH_SECRET=... AUTH_SECRET=... NEXTAUTH_URL=http://localhost:3000 API_URL=http://localhost:3001 npm run build && pnpm start   # :3000
```
Logins: superadmin `admin@mymanager.app`/`Superadmin123`; demo `demo@mymanager.app`/**`Demo1234`** (NOT Demo12345). Dev `.env`/`.env.local`/root `.env` exist (gitignored). Run the browser over **http** with `DISABLE_HTTPS_UPGRADE=1` (prod build; dev mode breaks on the CSP eval).

## Prior task context
No open PR — work lands **directly on `main`** (GitHub Actions removed; no CI
gate, verify locally before pushing).

The entire `docs/audit-2026-07-20.md` HIGH + MEDIUM backlog is now cleared
(2026-07-21). This session, in order: dark-mode auth-card fix + Playwright E2E
(PR #10); removed GitHub Actions; both HIGH items (browser pool, refresh-token
reuse detection); ESLint repair; all MEDIUM items (auth hardening, plan/quota
guards, brand XSS, analytics, route coverage); and the 60+ `fetch()` → `apiClient`
migration. All verified: API tsc/lint clean + 284 tests; web tsc/lint clean +
build + e2e green.

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
- **2026-07-22** — Two systemic bug patterns fixed audit-wide. (1) API: paginated
  list controllers must use `@Query('page', new DefaultValuePipe(1), ParseIntPipe)`
  — a bare TS default (`page = 1`) is silently coerced to `NaN` by the global
  `ValidationPipe({transform,enableImplicitConversion})` when the param is absent,
  producing Prisma `skip:NaN` 500s. (2) Web: never `.map`/`.slice` an API payload
  directly; go through `asArray(data, ...keys)` — response collection shapes are
  inconsistent (bare array vs `{data,pagination}` vs `{data,nextCursor}`).
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

**MEDIUM — mostly RESOLVED 2026-07-21 (commit 9f084f7)**
- ~~Auth: reset-token throttle backwards (M3), login timing enumeration (M4),
  TOTP replay + non-constant-time (M5)~~ → all fixed + tested.
- ~~Analytics in-memory aggregation (M7)~~ done earlier; ~~silent analytics
  catch blocks (M6)~~ now logged; ~~unbounded bulk-media query (M8)~~ capped.
- ~~4 unregistered guards (M14)~~ → Plan/Feature/Quota registered globally as
  opt-in (no-op without @RequirePlan/@RequireFeature/@RequireQuota); ApiKeyGuard
  stays per-route by design. **Enforcement is wired but inert** until routes get
  the decorators + plan tiers define limits (product config).
- ~~Brand-color XSS (M2)~~ → strict `validateHexColor` gate.
- ~~error.tsx/loading.tsx gaps~~ → filled where missing.

- ~~73 raw `fetch()` calls bypass `lib/api/client.ts`~~ → DONE (commit 2100819):
  26 files migrated to `apiClient`, 0 raw `/api/v1` fetches remain; added
  `skipAuthRefresh` opt-out for credential POSTs. ⚠️ login/signup submit paths
  need a **manual smoke test** on the live stack (not exercisable by build/e2e).

**Still open (smaller / needs product input)**
- Apply the now-live `@RequirePlan`/`@RequireFeature`/`@RequireQuota` decorators
  to real routes, and define the tier limit keys QuotaGuard reads — product config.
- `any` types in `app/`/`lib/`; broaden `@mymanager/ui` adoption (package exists
  as of Jul 20 but most components still local).

## API responses are NOT envelope-wrapped
`TransformInterceptor` exists but is **never registered** (main.ts wires only
`MetricsInterceptor`; no `APP_INTERCEPTOR`). The API returns raw bodies, so
`apiClient`'s `{success,data}` unwrap branch never fires — it returns the body
verbatim. Don't assume a `{success,data}` envelope when reading API responses.

**Unverified**
- Whether the web composer converts local→UTC correctly before sending
  `scheduled_at`. API side is correct (`timestamptz` in UTC); needs a frontend check.

## Next steps
1. ~~Manual smoke test of login/signup~~ ✅ done 2026-07-22 (fresh login → clean /home).
2. ~~Sweep superadmin pages~~ ✅ done 2026-07-22 (commit 7d2ef80).
3. ~~Build the 5 missing superadmin backend endpoints~~ ✅ done 2026-07-22 (commit 8a3132e).
4. Add `icon-192.png` (or drop the manifest ref) to kill the last console 404.
5. Set a CKEditor license key (email-template body editor throws license-key-missing).
6. Apply plan/quota decorators to real routes + define tier limits (product).
7. Test coverage: now **35 API suites / 308 tests** (added regression specs for
   the 5 new admin endpoints, commit f25a797). Still worth adding: a
   pagination-default 500 guard (call a list endpoint with no page/limit) and
   asArray parsing on the web side. OAuth flows + scheduling still thin.
8. Remaining Phase 2 durables: extract `packages/ui`, `any`-type cleanup.
9. Minor: exempt `/superadmin/login` from the middleware auth gate; give
   `/superadmin/settings/theme` a proper `<title>`.

## ESLint (fixed 2026-07-21)
`pnpm lint` works again. The API's `import/no-unused-modules` rule was removed:
it's broken under ESLint 9 flat config and misreported DI-wired providers as
unused (300+ false positives). API now lints clean (0 problems); web has 2
pre-existing benign warnings.

## Active branches
- `main`: stable, all work lands here directly
