# Phase 3 Plan — AI Per-Platform Adaptation Endpoint

Status: **DRAFT for approval** (2026-07-31). No code written. Part of
[per-platform content adaptation](./plan-per-platform-content-adaptation.md).
Depends on Phase 0 (registry), Phase 1 (premium), Phase 2 (storage contract).

## Goal

One endpoint that takes a master caption + selected platforms and returns, per
platform, a tailored caption (respecting that platform's effective caption
limit, content-type rules, hashtag/link handling) and — for threading platforms
(`x`, `threads`) that overflow — an ordered `segments[]` thread split. One
Claude call, structured output, credit-metered. Writes nothing itself: the
caller folds the result into `platform_options[slug]` via the Phase 2
`platformCaptions` contract.

## Endpoint

`POST /api/v1/ai/caption/adapt`

```ts
// Request (AdaptCaptionDto)
{
  workspaceId: string;
  masterCaption: string;            // 1..5000
  platforms: string[];              // canonical slugs, e.g. ['x','google-business','linkedin']
  tone?: string;                    // default 'professional'
  language?: string;                // default 'English'
  // premium is resolved server-side per connected account, not passed in
}

// Response
{
  adaptations: {
    [slug: string]: {
      caption: string;              // <= effective limit for slug
      segments?: string[];          // present only for threading platforms that overflowed
      truncated?: boolean;          // true when a non-threading platform was trimmed to fit
      captionLimit: number;         // the effective limit applied (for UI display)
    }
  };
  creditsUsed: number;              // 1 per adapt call (flat), regardless of platform count
}
```

The response shape is deliberately the **same** map the Phase 2
`platformCaptions` DTO accepts, so the web layer round-trips it straight into
`POST/PUT /posts` with no reshaping.

## Model & structured output

- **Model:** `claude-opus-5` (per house default). Cost note: this call fans out
  over N platforms in a single request, so it's not high-frequency; Opus-tier is
  justified for caption quality. If cost pressure appears, `claude-sonnet-5` is
  the drop-in step-down. **Decision point for approval — see below.**
- **Why not the existing model:** the AI module currently uses
  `claude-sonnet-4-20250514`, which **does not support structured outputs**.
  Phase 3 needs guaranteed-shape JSON, so it must run on a structured-outputs
  model (Opus 5 / Opus 4.8 / Sonnet 5 / Haiku 4.5). This upgrade is scoped to
  the new `adaptCaption` method only — existing `generateCaption`/`rewrite`/etc.
  stay on their current model in this phase.
- **Mechanism:** `output_config.format` with a `json_schema` (via
  `client.messages.parse()` for automatic validation), NOT tool-use. Schema:
  `{ adaptations: { <slug>: { caption, segments?, truncated? } } }` with
  `additionalProperties: false`. One call returns all platforms.
- **Effort:** `medium` (routine rewriting; keeps cost/latency down).
- `max_tokens`: ~4000 non-streaming (well under the timeout ceiling; adapting
  ~10 platforms of short captions fits easily).

## Prompt shape

System: platform-copywriting rules. User message carries the master caption plus
a compact per-platform spec table built server-side from the **registry** (now
slug-form-agnostic after the 2026-07-31 fix):

```
For each platform, rewrite the master post. Constraints per platform:
- x (premium): limit 25000, threads=yes, hashtags=0, link=inline
- google-business: limit 1500, threads=no, hashtags=0, link=native_field
- linkedin: limit 3000, threads=no, hashtags=30, link=inline
Master post: "<masterCaption>"  Tone: <tone>  Language: <language>
```

Per-platform facts come from `resolveEffectiveLimits(slug, isPremium)` +
`getPlatformCapability(slug)` (`supportsThreads`, `hashtagLimit`,
`linkHandling`, `contentTypes`). `isPremium` per platform is resolved from the
connected account via Phase 1 `accountIsPremium()`.

## Post-generation guard (deterministic, not model-trusted)

The model is asked to obey limits, but we enforce them in code after:

1. For each returned caption, if `length > effectiveLimit`:
   - `supportsThreads(slug)` → split into `segments[]` at sentence boundaries,
     each `<= limit` (optionally `1/n` suffixes). Store both `caption`
     (first segment or full text) and `segments`.
   - else → hard-trim to `limit`, set `truncated: true`.
2. Thread-split lives in a pure helper `splitIntoThread(text, limit)` in
   `packages/utils` (unit-testable, reused by Phase 4 workers).
3. Missing/blank platform in the model output → fall back to `masterCaption`
   (trimmed per guard). Never return an empty caption.

## Credits

Reuse `checkCredits` / `logCreditUsage` (`ai.repository`). Flat **1 credit per
adapt call** regardless of platform count (deduct once, after a successful
generation). `checkCredits` before the Claude call; `logCreditUsage('caption_adapt', 1)` after.

## Files touched

| File | Change |
|------|--------|
| `apps/api/src/modules/ai/dto/adapt-caption.dto.ts` | **new** — `AdaptCaptionDto` |
| `apps/api/src/modules/ai/ai.service.ts` | **new** `adaptCaption()`; add a structured-output Anthropic client path (parse) on the upgraded model |
| `apps/api/src/modules/ai/ai.controller.ts` | **new** `POST caption/adapt` route |
| `apps/api/src/modules/ai/ai.repository.ts` | `caption_adapt` credit action (if action is enumerated) |
| `packages/utils/thread-split.ts` | **new** `splitIntoThread(text, limit)` + index |
| `packages/constants` | none — resolvers already in place (Phase 0/2) |
| web | none this phase (compose UI is Phase 5) |

## Tests

- `thread-split.spec.ts` — sentence-boundary split; word-boundary fallback for a
  single over-limit sentence; exact-limit no-op; `1/n` suffixing.
- `ai.service` `adaptCaption` — Anthropic client **mocked**: asserts the guard
  trims non-threading over-limit output, threads X over-limit output, falls back
  to master on a missing slug, and deducts exactly 1 credit.
- Controller e2e — auth + workspace scoping + credit-limit 400 path.
- Slug-form: an `adapt` for `google-business` applies the 1500 limit (guards the
  registry fix stays wired through the real path).

## Out of scope (later phases)

- Threaded **publishing** (posting segment reply-chains) → Phase 4. Phase 3 only
  *produces and stores* segments.
- Compose per-platform tabs / "Adapt for all" button → Phase 5.
- Deep per-field validation surface → Phase 6.

## Milestone fit

Delivers the M1 core (per-platform captions + AI adapt, trim/warn everywhere,
no live threading). After Phase 3, Phase 5 (UI) makes it user-visible; Phase 4
adds real thread publishing for M2.

## Approval questions

1. **Model** — default `claude-opus-5`, or `claude-sonnet-5` for lower cost?
2. **Credit cost** — flat 1 per adapt call (proposed), or 1-per-platform?
3. **Thread `1/n` suffixes** — auto-append on splits, or leave clean and let the
   user add them?
