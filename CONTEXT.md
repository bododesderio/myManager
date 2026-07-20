# Project Context
Last updated: 2026-07-20

## Current task
Phases 0 and 1 complete; Phase 2 **partially** complete. All on branch
`fix/phase0-critical-security`. Awaiting review/merge.

- 266a450 — Phase 0: payment bypass, tenancy bypasses, duplicate publishing
- 094b71e — Phase 1: decimal money, atomic registration, unified crypto,
  real health checks, env validation, web Sentry, web build fix
- 891651b — Phase 2 (partial): repository-level workspace scoping (4 modules),
  Chromium pool, paged CSV export

**Phase 2 is much larger than 0 and 1 and is NOT finished.** See below.

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

## Phase 2 — remaining work

**Tenancy scoping — DONE.** All 11 workspace-scoped modules enforce tenancy in
the WHERE clause: templates, bio-pages, rss, competitors, media, reports,
webhooks, api-keys, comments, social-accounts. (`users`, `plans`,
`billing.plan`, `sales-leads` are legitimately global — do NOT scope those.)
Method that worked: change the repository signature first, then let `tsc`
enumerate every call site. Do not grep for them.

**CI gate — DONE.** `pnpm type-check` now passes 4/4 workspaces (was exit 2).
Root scripts use `--continue` so every failing workspace is reported in one run.

**DONE:** SQL aggregation (hashtags/campaigns/projects), competitors N+1,
platform-catalogue caching, route-level `loading.tsx`, theme-aware skeletons,
all 39 error boundaries wired to Sentry, `/portal` + `/user` boundaries added.

**Not started:**
- `packages/ui` — no shared component library exists; 28 components live in
  `apps/web/components` on raw HTML elements.
- `packages/validators` still has **zero** imports in web; every form hand-rolls
  validation in `useState`.
- Accessibility: icon-only buttons without labels, no modal focus management.
  (Skeletons were done; the rest of the surface was not audited component by
  component.)
- Test coverage: 18 suites for 43 modules. Zero coverage on OAuth flows,
  scheduling, 8 of 10 platform workers.

## [RESOLVED] The `<Html>` build failure — root cause found

**`NODE_ENV=development` was exported in the developer's shell.** `next build`
inherited it, Next built in a hybrid mode, and the static export of Next's
internal `/404` and `/_error` pages died with
`<Html> should not be imported outside of pages/_document`.

It was never a defect in this repository. Proof: a pristine three-file Next
15.5.14 app — npm not pnpm, outside the workspace, no config — reproduces the
error exactly, and building this repo with `NODE_ENV=production` succeeds.
It is a known Next.js App Router issue (vercel/next.js#56481).

Guarded so it cannot recur: `apps/web` build script now pins
`NODE_ENV=production next build`, which is correct for a build regardless of the
shell. Verified: `pnpm build` succeeds even with `NODE_ENV=development` exported.

### Also fixed while chasing this
`turbo build` was not passing `NEXTAUTH_SECRET` to the web build — Turbo 2
filters env vars unless declared. CI runs `pnpm build`, so CI would have hit the
same wall. `turbo.json` now declares `env` for build/test and `globalEnv`.

**`pnpm build` now succeeds for the whole monorepo (3/3 tasks) for the first time.**

### Retracted: two of the three "build blockers" were not real
Only the jsdom/`serverExternalPackages` fix was genuine — verified by building
the pre-fix commit with correct `NODE_ENV`, which still failed at `/blog/[slug]`.

The `force-dynamic` additions to the `(dashboard)`, `superadmin` and `user`
layouts were REVERTED. They were a response to the `NODE_ENV` artifact, they are
redundant (the layouts already `await auth()`, which opts them out of static
rendering), and the code comments justifying them were factually wrong. Those
three files are now byte-identical to their pre-Phase-2 state.

## [SUPERSEDED — kept for the record] earlier investigation notes

Three real build blockers were found and fixed (jsdom bundling; static
prerendering of auth-gated routes in `(dashboard)`, `superadmin`, `user`).
A fourth failure remains and I could **not** determine whether it is a defect in
this project or an artefact of the dev machine:

```
Error: <Html> should not be imported outside of pages/_document
Export encountered an error on /_error: /404
```

Reproduce: `NEXTAUTH_SECRET=<32+ chars> NEXTAUTH_URL=http://localhost:3000 npx next build`
in `apps/web`. Compilation succeeds and 16 static pages generate; only Next's
internal pages-router `/_error` export fails.

### Ruled out by experiment (each tested, each still failed)
- `@sentry/nextjs` in `global-error.tsx` — removed it
- `global-error.tsx` entirely — moved it out
- `app/not-found.tsx` — moved it out
- the whole `(marketing)` route group — moved it out
- any dependency importing `next/document` — only `@next/eslint-plugin-next`
  does, and it is not a runtime dep
- edge runtime on `app/opengraph-image.tsx` — switched to nodejs
- `output: 'standalone'` — removed
- `next.config.ts` — removed entirely
- the `webpack: ">=5.104.0"` pnpm override — removed
- Next version — pinned 15.4.7 (fails identically, so not a 15.5 regression)
- React version — pinned 19.1.1
- Node version — tested on both 20 (CI's version) and 24
- `middleware.ts` and `instrumentation.ts` — moved out

### The decisive result
Reducing `apps/web` to a **two-file app** (bare `layout.tsx` + `page.tsx`, no
config, no middleware) still fails identically. So it is not this project's
application code.

A pristine Next 15.5.14 scaffold **outside** the workspace also fails to build on
this machine — with a different error, on both Node 20 and 24. That makes the
environment a live suspect and means the `<Html>` failure cannot currently be
attributed to the repository at all.

### Next step for whoever picks this up
Run `pnpm --filter @mymanager/web build` on CI or another machine. If it passes
there, this is local-environment noise and nothing in the repo needs fixing. If
it fails there too, resume from "a two-file app also fails", which points at the
installed dependency tree rather than app code.

CORRECTION: the earlier claim in this file that "apps/web cannot complete a
production build" was overstated — it could not be verified, because this
environment cannot build a pristine Next app either. The Phase 1 claim that
`next build` exited 0 was also wrong: it was measured under
`SKIP_ENV_VALIDATION=1` with no `NEXTAUTH_SECRET`, which is not a realistic
production configuration.

**Flagged, needs a product decision (not a bug I should fix unilaterally):**
- `bio-pages.controller.ts` has zero `@Public()` decorators despite two routes
  named/documented public (`GET public/:slug`, `POST :slug/click`). Anonymous
  visitors get 401, so link-in-bio does not work publicly. Adding `@Public()`
  expands anonymous access — confirm that is intended before changing.

## Next steps
0. **REQUIRES A HUMAN — cannot be done from the repo.** Enable branch protection
   on `main` requiring the CI check to pass before merge. The gate itself was
   never broken: CI exited 2 correctly and was merged past anyway. Until
   protection is on, the next red pipeline lands the same way.
1. Review/merge `fix/phase0-critical-security` (Phases 0 + 1 + partial 2).
   - Tune `PUPPETEER_POOL_SIZE` (default 2) to the worker's memory budget.
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
