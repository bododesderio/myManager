# Project Context
Last updated: 2026-07-31

## ▶ RESUME THE STACK (2026-07-25) — now a single self-contained command
All local Docker (containers, project images mymanager-api/web/worker, volumes,
network) was **fully torn down** at end of session. To bring it back:
```
cd /Data/Projects/myManager && docker compose up -d --build
```
This now does EVERYTHING on its own — builds all 3 images, then on api boot runs
`prisma migrate deploy` **and** the idempotent seed (plans, platforms, brand/
theme, CMS, superadmin/demo/agency+team logins), and creates volumes (incl. a new
`uploads_data` for media). Verified cold: 6 migrations + full seed, api+web
healthy. Needs the gitignored `.env` (NEXTAUTH_SECRET) + `apps/api/.env`
(JWT_SECRET/ENCRYPTION_KEY/OAuth creds) present — both still on this machine; keys
listed in `.env.example`. Logins: superadmin admin@mymanager.app/Superadmin123,
demo demo@mymanager.app/Demo1234, agency Agency1234, team member*1234*.
Canonical ports 5432/6379/3001/3000 — on THIS shared box those collide with other
projects; use a ports-only compose override (see `mymanager-local-stack-*` memory)
or stop the conflicting containers. Commit 742008a wired all this.

## ▶ NEXT SESSION STARTS HERE (2026-07-31) — Per-Platform Content Adaptation, Phase 3
Plan: `docs/plan-per-platform-content-adaptation.md`; **Phase 3 draft plan (awaiting
approval): `docs/plan-phase-3-ai-adapt.md`.** Phases 0/1/2 DONE + the GBP registry
slug fix. Next action: review/approve Phase 3, then implement `POST /ai/caption/adapt`.
Phase 3 open questions to answer first: model (opus-5 vs sonnet-5), credit cost
(flat 1 vs per-platform), auto `1/n` thread suffixes.

**Shipped 2026-07-31 (3 commits on main):**
- `6f6b390` — real myManager brand icons (favicon, app/icon, apple-icon, PWA
  192/512 maskable, transparent nav mark + wordmark). Masters under `brand/`.
  **This resolves the long-standing `icon-192.png` 404.** Brand purple `#664BEF`.
- `ca38de5` — **Phase 2 DONE**: per-platform caption/thread storage. `constants`
  resolvers (`resolvePlatformCaption`/`resolvePlatformSegments`/`mergePlatformAdaptations`),
  `platformCaptions` on Create/UpdatePostDto, service folds into `platform_options[slug]`.
  Adaptations keyed by CANONICAL (hyphen) slug. 11 tests.
- `5376b27` — **GBP slug fix**: registry was underscore-only (`google_business`),
  so `getCaptionLimit('google-business')` returned 2200 not 1500. `getPlatformCapability`
  now normalizes hyphen→underscore at the single lookup boundary. The two-slug design
  (underscore=DB/public, hyphen=OAuth/queue/worker) is INTENTIONAL — not a bug. 334/334 green.

**Stack**: bring up with `docker compose up -d --build` (canonical ports 5432/6379/3001/3000).

**✅ Phase 0 DONE (commit 4481656)** — one canonical capability registry
`packages/constants/platform-capabilities.ts` (`PLATFORM_CAPABILITIES` +
`resolveEffectiveLimits`/`getCaptionLimit`/`DEFAULT_CAPTION_LIMIT`; adds
supportsThreads/hashtagLimit/linkHandling/premium). Was **FOUR** disagreeing sources
(the runtime seed `prisma/seeds/index.ts` had its own map; standalone `platforms.seed.ts`
deleted). All derive from it now: utils/platform-limits.ts (thin adapter), seed
(fills content_types/limits JSON), ai.service (getCaptionLimit), ComposeContent
(DEFAULT_CAPTION_LIMIT). `constants` is a BUILT pkg — rebuild after edits.

**✅ Phase 1 DONE (commit 999dc3b)** — hybrid premium. `social_accounts.premium_override
Boolean?` (null=auto). X callback auto-detects via `verified_type`; others 'unknown';
callback now persists `scopes` too. `PUT /social-accounts/:id/premium`; list/get expose
is_premium/premium_available/premium_override. Web: tri-state tier control + badge in
Settings→Accounts. Live-verified with an X fixture.

**▶ NEXT — Phase 2:** per-platform caption/thread storage. Extend typed
`platform_options[slug]` (`packages/types/platform-options.ts`) with `caption?: string`
+ `thread?: string[]`, fall back to master `caption`; thread through
`posts.service.create/update`, `PostVersion`, and each per-platform BullMQ worker.
Milestone M1 = Phases 0→3+5 (no threading); M2 = Phase 4 threading.

## ▶ Prior resume (2026-07-25) — library picker verified; all 3 features fully live
Stack on **alternate ports** (box is shared with other projects): postgres **5442**,
redis **6389**, API **3011**, web **3010**. Bring-up recipe: `.claude/memory/mymanager-local-stack-and-live-findings.md`.
Test client: **amina@kampalamedia.co.ug / Kampala2026** (COMPANY, workspace `kampala-media-collective`, has a connected Google account + a draft with 3 photos).

**Done + verified live this session:**
1. **Google OAuth round-trip COMPLETE** — first real social connection. Fixed 3 latent bugs: callback 403 (WorkspaceMemberGuard → new `@SkipWorkspaceCheck()` decorator); FK 500 (`social_accounts.platform_id` FK repointed from `platforms.id`→`platforms.slug`, migration `20260724143000`); accounts-list crash (`platform` object→slug string + `platform_name`).
2. **Registration fields expanded** — phone, jobTitle, website, timezone, referralSource (surfaced); required-for-company (3-layer: form + Zod superRefine + service). first_name/last_name/country were dropped at signup — now persisted. New cols on users (phone/job_title/country) + workspaces (website), migration `20260724150000`.
3. **Media upload FIXED** (never worked before) — direct multipart upload replaces the unwired presigned flow; API serves `/uploads/*`; verified device-upload of 3 photos → thumbnails → attached to a draft. Global BigInt→JSON polyfill in main.ts. Empty `@` handle fixed. Details: `.claude/memory/mymanager-media-upload.md`.

**✅ DONE (2026-07-25):** the **"select from library" picker** in compose (`ComposeContent.tsx` `LibraryPicker`) is now **browser-verified live as Amina**: web rebuilt with the picker, /compose → "Or select from library" opens the modal, `GET /media` returns her 3 real images (photo1/2/3.png), multi-select shows checkmarks + "Add N" count, Add attaches to the Media area (imgs decode 120×80 from `http://localhost:3011/uploads/media/*`), and **dedup works** — reopening disables already-attached tiles ("Already added", opacity-40). 0 app console errors. (Note: a JS `fetch()` to /uploads trips CSP `connect-src` — that's expected; `<img>` loads are fine.)

**Also pending:** rotate the Google account password (shared in chat 2026-07-24). Account-less drafts still blocked (composer + `@ArrayMinSize(1)`) — product decision.

## Current task — FULL end-to-end live audit (every role/flow), IN PROGRESS (2026-07-22 pm)
Rebuilt everything clean. Working through: A marketing → B visitor journey →
C individual user → D agency admin → E team member → F superadmin CMS → G nav.
Then: UI redesign. Fix-immediately, commit-per-fix. All on `main`, tree clean.

**DONE & GREEN:**
- **A. Marketing site** — favicon+PWA icons (killed icon-192 404 site-wide),
  landing+subpage title doubling, canonical, dead footer links; all 8 pages 0 errors.
  Commits 55133d6, 0a32275, 4e430d0.
- **B. Visitor journey** — individual + company signup work end-to-end to
  email-verify → login → dashboard. Fixed: signup showed hardcoded WRONG plan
  prices (now fetches /plans) [0a31b02]; cross-user workspace leak / 403 burst on
  shared-browser re-login (WorkspaceUserGuard) [5ea733d]; signup workspaces
  dropped account_type/owner_id/industry/team_size/referral_source [df6f52b].
- **C (partial). Media uploads** — broadened formats (added HEIC/HEIF/AVIF/BMP/
  TIFF/WebM; SVG excluded for XSS) + video-aware per-category caps (img 25MB,
  video 512MB) [eec709a]. Compose page renders clean.
- **C. Social OAuth connect** [f9c4af0] — the connect flow had **no initiate
  step** (Connect button → callback-only page; nothing could connect, any
  platform). Built the platform picker at `/connect/oauth`; static registerable
  redirect_uri (`/connect/oauth`), platform+workspace recovered from server
  `state`; platform-agnostic `POST /social-accounts/callback`. Fixed provider
  contracts: TikTok `client_key`+S256 PKCE+user/info fields; LinkedIn OIDC scopes
  +`/v2/userinfo`; X PKCE code_verifier+Basic-auth token. Spec added. **Live:
  TikTok initiate reaches its login/consent page** (client_key + PKCE accepted).
  Note: compose Save Draft/Schedule/Publish all require ≥1 selected account
  (backend `CreatePostDto @ArrayMinSize(1)`) — so post-create flows are testable
  only once an account is actually connected. Provider creds in gitignored
  `apps/api/.env` (TikTok+LinkedIn full; **X values are OAuth 1.0a — need the
  OAuth 2.0 Client ID/Secret**).

**⚠ PORT NOTE (2026-07-23):** the API now runs on **:3011**, not :3001 — an
unrelated Docker container (`rooibok-site-umami-1`, maps `0.0.0.0:3001->3000`)
grabbed :3001 during a nest watch-restart window (`EADDRINUSE`). The web was
**rebuilt with `API_URL=http://localhost:3011` baked** (Next bakes the
`rewrites()` destination at BUILD time — a runtime API_URL is ignored). Bring-up
now: `PORT=3011 pnpm --filter @mymanager/api dev`; **build** web with BOTH
`API_URL=http://localhost:3011` AND `DISABLE_HTTPS_UPGRADE=1` (both bake at build
time), then start with the same env. To restore the canonical :3001, free the port
(`docker stop rooibok-site-umami-1` — I was blocked from doing this by the
permission classifier) then rebuild the web without API_URL (defaults to :3001).

**Dashboard "blinking" — FIXED [b3e0e89].** Root cause: when the API refresh
token died but the NextAuth cookie was still valid, every 401 → /auth/refresh
(401) → redirect /login → middleware bounced /login→/home (cookie present) →
refetch → 401 … an infinite loop (~5 refresh/s, 985 429s, constant re-render).
Fix: on a HARD refresh failure (refresh returns 401) sign out of NextAuth first
so /login sticks; transient 429/network no longer force-logout. Global (in
apiClient) → fixes every dashboard.

**D — DONE [6116f0c].** Agency team mgmt was broken 5 ways (empty member cells;
role vocab owner/admin/editor/viewer vs enum OWNER/ADMIN/MEMBER; role change
PUT→404 (route is PATCH); Sidebar hid Team/Approvals for the OWNER via
case-mismatched role gate; 0/5 seats). All fixed + verified live (role change
round-trips to DB). Backend normalizes/validates role (400 not 500). Login false
"Unable to create a session" error also fixed [61cbeae] — verify via /api/auth/session.

**E — DONE [7ebf154].** MEMBER hit 403 on /members (needed for role+seat
derivation) → now any active member can READ the roster (mutations stay
owner/admin). Plan was resolved per-user → a MEMBER of a paid workspace saw
"Free"; now /billing/subscription resolves by ?workspaceId (workspace-scoped
plan), so members see the real Enterprise plan + features. Verified live.

**F — DONE (verified 2026-07-23).** Superadmin CMS editing works end-to-end: FAQ
item edit (question + CKEditor answer) persisted to DB; CKEditor loads clean
(GPL-license fix holds). **Fixed a build-config miss:** the CSP
`upgrade-insecure-requests` is baked at BUILD time and my earlier builds omitted
`DISABLE_HTTPS_UPGRADE=1` → the admin sidebar prefetched RSC over https →
~20 `ERR_SSL_PROTOCOL_ERROR` per superadmin page. **Set `DISABLE_HTTPS_UPGRADE=1`
in the BUILD env (not just start)** → superadmin pages now 0 errors. (Local-only;
prod runs https and wants the directive.)

**G — DONE [11cb3b2, 3ef184f].** Content sub-nav (ContentLayout) linked to legacy
`/admin/content/*` (301→/superadmin) → redundant redirect + active-highlight
never matched; pointed hrefs at /superadmin/content/*. Theme page `<title>` fixed
via sibling layout.tsx ("Admin - Theme Editor"). /superadmin/login exempted from
the middleware gate (it's a backwards-compat redirect to the single /login;
now lands superadmins on next=/superadmin/dashboard). Empty-state sweep: all main
list pages already render empty states (calendar's is its grid) — no gaps. NOTE:
other `/admin/*` refs in superadmin are API paths (`/api/v1/admin/*` — CORRECT).

**AUDIT A→G COMPLETE (2026-07-23).** All seven flows swept + fixed live.
**RESUME HERE:** only external-blocked / product-config items remain — (1) social
round-trips (C-tail) need provider-side redirect-URI + test-user setup; Google is
ready to test now (Settings→Accounts→Connect→Google). (2) Apply plan/quota
decorators to real routes + define tier limits (product). (3) Optional: extract
`packages/ui`, `any`-type cleanup.
Pinterest [551597f] blocked on trial-access secret. **Google OAuth — WIRED &
VERIFIED (2026-07-23):** Web client creds (project mymanager-503306) in gitignored
apps/api/.env (`GOOGLE_CLIENT_ID`/`SECRET`); covers google-business + youtube.
Redirect `http://localhost:3000/connect/oauth` + JS origin `http://localhost:3000`
registered. Initiate verified to build a valid accounts.google.com authorize URL
(right client_id/redirect/scope) — the **first provider ready for a live
round-trip.** Caveat: if the consent screen is in "Testing", add your Google
account as a test user; business.manage/youtube scopes may warn "unverified app"
(fine for testing).

**Payment-gated (can't fully test locally):** Flutterwave checkout (no sandbox
keys). Social OAuth: initiate verified live; round-trip pending provider-side
redirect-URI registration + Sandbox test users (user action, not code).

**Pinterest** [551597f, 2026-07-23] — provider was already in the OAuth registry
but had two bugs now fixed: (1) token exchange used body-secret; Pinterest v5
mandates HTTP Basic auth — generalized the X-only Basic-auth branch to a
`basicAuth` flag (X+Pinterest, incl. refresh); (2) profile mapping used
'unknown' id (Pinterest `/v5/user_account` has no numeric id) + missed the
`profile_image` avatar — username now seeds platform_user_id. App id 1593428 set
in `apps/api/.env`. **[BLOCKED]** App secret is "Unavailable while trial access
pending" — round-trip untestable until Pinterest grants trial/standard access.

**Pending external inputs (blockers, user-side):**
- **Pinterest App secret** — pending Pinterest trial-access approval; set
  `PINTEREST_APP_SECRET` in apps/api/.env once issued. Register redirect URI
  `http://localhost:3000/connect/oauth` on the app (developers.pinterest.com/apps/1593428).
  Note: `pins:write` may require standard-access approval beyond trial.
- **Public domain** — NOT yet owned. Needed for the X app's required Website URL,
  TOS/Privacy URLs, and generally for prod OAuth redirect URIs. Until then, X app
  setup + any prod OAuth is blocked; local uses `http://localhost:3000`.
- **X OAuth 2.0 Client ID/Secret** — must set the X app to "Web App … Confidential
  client" + "Read and write" to mint these; the creds provided so far are OAuth
  1.0a (wrong type). Replace `TWITTER_CLIENT_ID/SECRET` in apps/api/.env once minted.
- **Register redirect URI** `http://localhost:3000/connect/oauth` on TikTok /
  LinkedIn / X consoles; add Sandbox test users (TikTok/X).
**Dev limitation:** email verification link not deliverable (no email provider) —
mark users verified via DB to continue a flow.

## Prior task — USER + SUPERADMIN SWEEPS COMPLETE (2026-07-22)
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
- ~~CKEditor `license-key-missing`~~ → FIXED 2026-07-22 (commit 7226a1b): set
  `licenseKey: 'GPL'` in CKEditorWrapper. Email-template body now saves real HTML.
  NOTE: 'GPL' commits the app to GPL-compatible terms (no key purchased).

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

**Verified (2026-07-25)**
- **Composer local→UTC conversion is CORRECT.** Live test as Amina (box @ GMT+3
  EAT): datetime-local `2026-07-26T15:30` → web POSTs `scheduledAt:
  "2026-07-26T12:30:00.000Z"` (−3h) → DB stores `2026-07-26 12:30:00+00`,
  status SCHEDULED. Payload field is `scheduledAt` (camelCase).
- **End-to-end post-create works with a real connected account.** Save Draft with
  the Google Business account selected + 2 library images → `POST /api/v1/posts`
  201 → DB row DRAFT with 2 `post_media` rows + `platforms:{google_business}`.
  Payload: `{workspaceId, caption, platforms[], contentType, mediaIds[],
  scheduledAt?}`. NOTE: **Save Draft resets the composer** (account deselected,
  caption + media cleared) — rebuild state before a follow-up Schedule/Publish.
  (Test posts were deleted after — a SCHEDULED post targets the REAL Google
  account and the worker would try to publish it.)

## Next steps
1. ~~Manual smoke test of login/signup~~ ✅ done 2026-07-22 (fresh login → clean /home).
2. ~~Sweep superadmin pages~~ ✅ done 2026-07-22 (commit 7d2ef80).
3. ~~Build the 5 missing superadmin backend endpoints~~ ✅ done 2026-07-22 (commit 8a3132e).
4. Add `icon-192.png` (or drop the manifest ref) to kill the last console 404.
5. ~~Set a CKEditor license key~~ ✅ done 2026-07-22 (used free 'GPL' key, commit 7226a1b).
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
