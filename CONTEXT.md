# Project Context
Last updated: 2026-07-20

## Current task
Phase 0 security remediation — **complete and committed** on branch
`fix/phase0-critical-security` (commit 266a450). Awaiting review/merge.

Next: Phase 1 (integrity & durability) from `docs/audit-2026-07-20.md` §6.

## Stack
Turborepo + pnpm 9.15.4 workspaces.
- `apps/api` — NestJS 10, Prisma 6, PostgreSQL 16, Redis 7, BullMQ (43 modules)
- `apps/web` — Next.js 15 App Router, React 19, Tailwind 4, Zustand, React Query (88 pages)
- `apps/mobile` — Expo SDK 53 (31 screens, ~24 wired to real APIs)
- `apps/extension` — browser extension (minimal)
- `packages/` — config, constants, emails, seo, translations, types, utils, validators
  (NO `packages/ui` — web components are unshared)
- External: Cloudflare R2, Resend, Flutterwave, Anthropic, Replicate, Sentry, PostHog
- Deploy: Railway (API) + Vercel (web) + EAS (mobile)

## Recent decisions
- **2026-07-20** — Full 6-dimension audit run; report at `docs/audit-2026-07-20.md`.
  Placed in `docs/` not `.claude/` because `.claude/` is gitignored and the
  readme references it.
- **2026-07-20** — Retracted the readme's PostgreSQL RLS claim. It was never
  implemented (no `CREATE POLICY` anywhere, `setWorkspaceContext()` unwired, and
  the app connects as the schema owner who would bypass RLS regardless).
  Documented controls that don't exist stop people from looking — treated as a
  security defect, not a docs nit.
- **2026-07-20** — Deferred splitting `billing.service.ts` (603 LOC) and
  `auth.service.ts` (551 LOC). Large but coherent and correctly layered;
  restructuring them while they contained live security bugs would add review
  surface for no user-visible gain.
- **2026-07-20** — Tenancy fix is layered, not just guard-level. The durable fix
  (Phase 2) is `workspace_id` in every repository `where` clause; the guard's
  hand-maintained route-prefix list will rot on the next module added.

## Known issues
Full detail in `docs/audit-2026-07-20.md`. Open items:

**HIGH**
- Money is `Decimal` in the price catalog but `Float` in the ledger
  (`schema.prisma:296,320,344,357`). Precision dies at `billing.service.ts:64`
  the moment a price becomes a charge.
- `Session.user_id` has no index; every logout full-scans the table. `Session`
  also doubles as refresh-token storage while a better-designed, apparently
  unused `RefreshToken` model exists (`schema.prisma:239-253`) — resolve which.
- Puppeteer launches a full Chromium per PDF (`report-generator.worker.ts:69`).
- Six independent AES-256-GCM implementations (one with a divergent 16-byte IV),
  spanning OAuth tokens AND TOTP secrets.
- Registration does 5 sequential writes with no transaction.
- Flutterwave webhook `verif-hash` is a static secret, not a payload HMAC.

**MEDIUM**
- No Zod env validation at boot; `ENCRYPTION_KEY` length unchecked.
- Health check returns 200 without touching DB/Redis.
- No Sentry on web.
- Analytics aggregated in Node memory, not SQL.
- 4 unregistered guards (`api-key`, `feature`, `plan`, `quota`) — there is no
  plan-tier or quota enforcement at the HTTP layer.
- Web: 0 `loading.tsx`, 59% of pages lack `error.tsx`, 73 raw `fetch()` calls
  bypassing the API client, 83 `any` types, `packages/validators` has zero
  imports in web.

**Unverified**
- Whether the web composer converts local time → UTC correctly before sending
  `scheduled_at`. An audit claimed a timezone bug; its reasoning was incoherent
  and the API side is correct (`timestamptz` compared in UTC). Needs a frontend
  check before any conclusion.

## Next steps
1. Review/merge `fix/phase0-critical-security`.
2. Phase 1: Float→Decimal migration, transactions on register + payment
   activation, `Session.user_id` index, server-side Flutterwave re-verification,
   single `CryptoService`, Zod env validation, real readiness probe, web Sentry.
3. Phase 2: repository-level `workspace_id` scoping, Puppeteer pool, SQL
   aggregation, Redis caching, `packages/ui`, adopt validators, a11y + loading
   states, test coverage (currently 13 suites for 43 modules).

## Active branches
- `main`: stable
- `fix/phase0-critical-security`: Phase 0 complete, 90/90 tests passing
