# Plan — Per-Platform Content Adaptation

Status: **APPROVED (plan-only), not yet implemented** — 2026-07-25
Owner: Bodo Desderio

## Goal
One master post → per-platform tailored content that respects each platform's
content-type rules and character limits, auto-rewritten by AI, and aware of
premium account tiers that raise those limits.

## The problem today
- One shared `caption` for every platform.
- Compose counter collapses to `Math.min()` of all selected platforms' limits, so
  Google Business (1,500) + X (280) caps the *entire* post at 280.
- No notion of accepted content types at post time; no premium/tier awareness.

## Locked decisions (2026-07-25)
1. **Storage** — per-platform text in `platform_options[slug]` JSON (master
   `caption` stays the fallback). No new table for MVP.
2. **Premium** — **hybrid**: auto-detect where the provider API exposes it,
   plus a user-declared per-account toggle that always overrides.
3. **Over-limit** — **auto thread-split** on platforms that support threading;
   **trim + warn** on platforms that don't.

### Consequence of the threading decision
Threading only works where connected posts exist: **X** and **Threads** (Bluesky
if added). Google Business, LinkedIn, Facebook, Instagram, Pinterest, YouTube,
TikTok, WhatsApp **cannot thread** → gated on a `supportsThreads` capability;
non-threading platforms over the limit fall back to trim + warn.

## Grounding (verified in code, 2026-07-25)
- Limits live in THREE disagreeing places: DB `platforms` table (seeded, drives
  the UI via `GET /platforms`), `packages/utils/platform-limits.ts` (richest —
  adds `supported_content_types`, media rules), and a 4th incomplete inline map
  in `apps/api/src/modules/ai/ai.service.ts:71-74`.
- No per-platform caption anywhere. `CreatePostDto.caption` is a single string;
  `posts` has `caption String`, `platforms String[]`, `platform_options Json`.
  `platform_options` (typed in `packages/types/platform-options.ts`) holds
  per-platform *publish settings* — the natural home for per-platform captions.
- AI module exists (`apps/api/src/modules/ai/`), Anthropic SDK,
  `claude-sonnet-4-20250514`, endpoints `caption/generate` + `caption/rewrite`,
  a monthly **credits** system. No "adapt across N platforms" call yet.
- `social_accounts` has NO tier/premium column — only free-form `metadata Json`,
  not populated at OAuth. OAuth callback drops `scopes` too
  (`social-accounts.service.ts:263-274`). No provider fetches verified/premium.
- Publishing already fans out per platform via `queueMap` BullMQ queues
  (`posts.service.ts:134-166`) — natural insertion point for per-platform text.
- Compose: single `caption` state; `getActiveCharLimit` = `Math.min(...)` across
  selected platforms, default 2200 (`ComposeContent.tsx:49-62,89`).

## Phases

### Phase 0 — One capabilities registry (foundation) ✅ DONE 2026-07-27
Implemented in `packages/constants/platform-capabilities.ts` (`PLATFORM_CAPABILITIES`
+ `resolveEffectiveLimits` + `getCaptionLimit` + `DEFAULT_CAPTION_LIMIT`). It was
**four** disagreeing sources, not three (the runtime seed `prisma/seeds/index.ts`
had its own inline map). All now derive from the registry:
- `packages/utils/platform-limits.ts` → thin adapter (no data of its own).
- `prisma/seeds/index.ts` seedPlatforms → derives rows + fills `content_types`/`limits`
  JSON (supports_threads, hashtag_limit, link_handling, premium); presentation
  (color/api_version/auth_type/phase) stays local. Orphaned `platforms.seed.ts` deleted.
- `ai.service.ts` inline map → `getCaptionLimit(platform)`.
- `ComposeContent.tsx` `2200` literals → `DEFAULT_CAPTION_LIMIT`.
Verified live: DB seeded from registry, `GET /platforms` serves content_types + limits.premium.

_Original scope:_
Collapse the 3 limit sources into a canonical typed spec in `packages/constants`,
keyed by slug: `contentTypes[]`, `captionLimit`, `maxImages`, `maxVideoSec`, min
image dims, **`supportsThreads`**, `hashtagLimit`, `linkHandling`, and
**`premiumTiers`** (e.g. `x.premium.captionLimit = 25000`). Seed the DB
`platforms` table from it (fill the empty `content_types`/`limits` JSON) so the
UI keeps reading `GET /platforms`. Delete the `2200` fallbacks
(`ComposeContent.tsx:58,60`, `ai.service.ts:75`) and the inline AI map.

### Phase 1 — Effective limits + hybrid premium
- `social_accounts.metadata.tier` (or an `account_tier` column) drives premium.
- Auto-detect at OAuth callback where feasible (realistically **X only** via
  `verified_type` on `users/me`); persist `scopes` + capability data (currently
  dropped). Others record `tier: unknown`.
- User toggle in Settings → Accounts ("This account has X Premium") overrides.
- `resolveEffectiveLimits(platform, account)` = base spec lifted by `premiumTiers`
  when premium.

### Phase 2 — Per-platform content storage
Extend typed `platform_options` per slug: `caption?: string` (single-post) and
`thread?: string[]` (ordered segments). Fall back to master `caption`. Thread it
through `posts.service.create/update`, `PostVersion`, and each per-platform
BullMQ worker.

### Phase 3 — AI adaptation endpoint
`POST /ai/caption/adapt`: `{ masterCaption, platforms[], tone?, language? }` →
resolve each platform's effective limits → ONE Claude call (structured JSON
tool-output) returning per slug a single `caption` OR, for a thread-supporting
platform over its limit, an ordered `thread[]` split at sentence boundaries
(optional `1/n`). Post-gen guard trims non-threading over-limit results. Wired
into the credits system.

### Phase 4 — Threaded publish workers
X (and Threads) workers gain thread posting: publish segment 1, capture id, post
each next segment as a reply to the previous, partial-failure handling recorded
in `PostPlatformResult`. Non-threading workers unchanged.

### Phase 5 — Compose UI
Master editor + per-platform tabs. Each tab: adapted caption, live counter vs the
**effective** (premium-aware) limit, content-type warnings. Thread-supporting
platforms render over-limit content as numbered segment cards (add/edit/reorder).
"Adapt for all" calls `/ai/caption/adapt`; manual edits win. Submit sends
`platform_options[slug]`; preview renders each platform's own text/thread.

### Phase 6 — Validation & tests
Backend validates each platform's caption/thread against effective limits +
content-type gating (e.g. Instagram requires media). Tests: registry resolution,
hybrid premium effective-limit, `/ai/caption/adapt` incl. thread-split (mocked
Anthropic), threaded publish delivery + partial failure. Migration: tier field +
platform seed enrichment.

## Suggested milestones
- **M1** — Phases 0→3 + 5 **without threading** (per-platform captions + AI adapt
  + trim/warn everywhere). Delivers per-platform adaptation end-to-end.
- **M2** — Phase 4 + segment UI (auto thread-split on X/Threads). The largest and
  riskiest slice — sequential thread publishing with partial-failure handling.

## Start here next session
Phase 0: create `packages/constants` canonical capability spec + seed the DB
`platforms` table from it; retire the duplicate limit maps.
