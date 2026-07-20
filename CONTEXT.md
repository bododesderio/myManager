# Project Context
Last updated: 2026-07-20

## Current task
Phases 0 and 1 — **complete and committed** on branch
`fix/phase0-critical-security`. Awaiting review/merge.

- 266a450 — Phase 0: payment bypass, tenancy bypasses, duplicate publishing
- 094b71e — Phase 1: decimal money, atomic registration, unified crypto,
  real health checks, env validation, web Sentry, web build fix

Next: Phase 2 (scale & maintainability) from `docs/audit-2026-07-20.md` §6.

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

**HIGH — remaining**
- Puppeteer launches a full Chromium per PDF (`report-generator.worker.ts:69`).
- `RefreshToken` model (`schema.prisma:239-253`) is dead — 0 references — while
  `Session` serves as refresh-token storage. `RefreshToken` has `used_at` /
  `revoked_at` and is the right target for reuse detection (M1). Decide whether
  to migrate auth onto it or drop it; do not leave both.

**MEDIUM — remaining**
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
1. Review/merge `fix/phase0-critical-security` (Phases 0 + 1).
   - **Take a DB backup first**: the Float→Decimal cast in migration
     `20260720120000` is one-way.
   - Point orchestrators at `/health/ready` (503) and `/health/live`.
   - Set `NEXT_PUBLIC_SENTRY_DSN` for browser error capture.
   - `NEXTAUTH_SECRET` is now mandatory — `docker compose` commands fail without
     it. That is intentional (M10), but it does change local dev ergonomics.
2. Investigate why CI's `turbo type-check` did not catch that `apps/web` could
   not compile. A broken build reached `main` — the gate is not working.
3. Phase 2: repository-level `workspace_id` scoping (the durable tenancy fix),
   Puppeteer pool, SQL aggregation, Redis caching, `packages/ui`, adopt
   validators in web forms, a11y + loading states, test coverage
   (16 suites for 43 modules).

## Active branches
- `main`: stable
- `fix/phase0-critical-security`: Phase 0 complete, 90/90 tests passing
