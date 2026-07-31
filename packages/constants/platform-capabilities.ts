/**
 * @author Bodo Desderio <rooiboktechltd@gmail.com>
 * @copyright 2026 Rooibok Technologies. All rights reserved.
 */
import { PlatformSlug } from './platforms';
import { ContentTypeSlug } from './content-types';

/**
 * Canonical per-platform capability registry — the SINGLE source of truth for
 * content-type support, character/media limits, threading, and premium-tier
 * uplifts. The DB `platforms` table is seeded from this (see
 * apps/api/prisma/seeds/platforms.seed.ts), `@mymanager/utils`
 * `PlatformLimitsService` adapts it, and the AI + compose layers read caption
 * limits from it. Do NOT reintroduce a second limits map anywhere.
 */

/** How clickable links are handled in a post body on this platform. */
export type LinkHandling =
  | 'inline' // link sits in the body and renders a preview
  | 'first_comment' // link is best placed in the first comment
  | 'bio_only' // body links are not clickable; strategy is "link in bio"
  | 'native_field' // link supplied via a dedicated field (Pinterest link_url, GBP CTA)
  | 'unsupported';

/** The subset of limits that a premium account tier may raise. */
export interface PlatformCapabilityLimits {
  captionLimit: number;
  maxImages: number;
  maxVideoSec: number;
  maxFileSizeMb: number;
  minImageWidth: number;
  minImageHeight: number;
  /** Recommended/hard max hashtags (0 = not applicable). */
  hashtagLimit: number;
}

export interface PlatformCapability extends PlatformCapabilityLimits {
  slug: PlatformSlug;
  contentTypes: ContentTypeSlug[];
  linkHandling: LinkHandling;
  /** True only where connected reply-chains exist (X, Threads). */
  supportsThreads: boolean;
  /** Fields lifted when the connected account is a premium/paid tier. */
  premium?: Partial<PlatformCapabilityLimits>;
}

/** Fallback caption limit for an unknown platform or empty selection. */
export const DEFAULT_CAPTION_LIMIT = 2200;

export const PLATFORM_CAPABILITIES: Record<PlatformSlug, PlatformCapability> = {
  facebook: {
    slug: 'facebook',
    captionLimit: 63206,
    maxImages: 10,
    maxVideoSec: 14400,
    maxFileSizeMb: 4096,
    minImageWidth: 200,
    minImageHeight: 200,
    hashtagLimit: 30,
    linkHandling: 'inline',
    supportsThreads: false,
    contentTypes: [
      'text_only', 'image_single', 'image_carousel',
      'video_long', 'video_short', 'image_story', 'video_story',
    ],
  },
  instagram: {
    slug: 'instagram',
    captionLimit: 2200,
    maxImages: 10,
    maxVideoSec: 5400,
    maxFileSizeMb: 4096,
    minImageWidth: 320,
    minImageHeight: 320,
    hashtagLimit: 30,
    linkHandling: 'bio_only',
    supportsThreads: false,
    contentTypes: [
      'image_single', 'image_carousel',
      'video_short', 'image_story', 'video_story',
    ],
  },
  x: {
    slug: 'x',
    captionLimit: 280,
    maxImages: 4,
    maxVideoSec: 140,
    maxFileSizeMb: 512,
    minImageWidth: 200,
    minImageHeight: 200,
    hashtagLimit: 0,
    linkHandling: 'inline',
    supportsThreads: true,
    contentTypes: ['text_only', 'image_single', 'video_short'],
    // X Premium / Premium+ raises the body limit and long-video ceiling.
    premium: { captionLimit: 25000, maxVideoSec: 10800 },
  },
  linkedin: {
    slug: 'linkedin',
    captionLimit: 3000,
    maxImages: 9,
    maxVideoSec: 600,
    maxFileSizeMb: 5120,
    minImageWidth: 552,
    minImageHeight: 276,
    hashtagLimit: 30,
    linkHandling: 'inline',
    supportsThreads: false,
    contentTypes: [
      'text_only', 'image_single', 'image_carousel',
      'video_long', 'document',
    ],
  },
  tiktok: {
    slug: 'tiktok',
    captionLimit: 2200,
    maxImages: 35,
    maxVideoSec: 600,
    maxFileSizeMb: 4096,
    minImageWidth: 360,
    minImageHeight: 640,
    hashtagLimit: 30,
    linkHandling: 'bio_only',
    supportsThreads: false,
    contentTypes: ['video_short', 'video_long', 'image_carousel'],
  },
  google_business: {
    slug: 'google_business',
    captionLimit: 1500,
    maxImages: 1,
    maxVideoSec: 0,
    maxFileSizeMb: 25,
    minImageWidth: 250,
    minImageHeight: 250,
    hashtagLimit: 0,
    linkHandling: 'native_field',
    supportsThreads: false,
    contentTypes: ['gbp_update', 'gbp_event', 'gbp_offer', 'gbp_product'],
  },
  pinterest: {
    slug: 'pinterest',
    captionLimit: 500,
    maxImages: 1,
    maxVideoSec: 900,
    maxFileSizeMb: 32,
    minImageWidth: 236,
    minImageHeight: 354,
    hashtagLimit: 20,
    linkHandling: 'native_field',
    supportsThreads: false,
    contentTypes: ['pin_image', 'pin_video', 'pin_product'],
  },
  youtube: {
    slug: 'youtube',
    captionLimit: 5000,
    maxImages: 0,
    maxVideoSec: 43200,
    maxFileSizeMb: 262144,
    minImageWidth: 0,
    minImageHeight: 0,
    hashtagLimit: 15,
    linkHandling: 'inline',
    supportsThreads: false,
    contentTypes: ['video_long', 'video_short'],
  },
  whatsapp: {
    slug: 'whatsapp',
    captionLimit: 4096,
    maxImages: 1,
    maxVideoSec: 120,
    maxFileSizeMb: 100,
    minImageWidth: 0,
    minImageHeight: 0,
    hashtagLimit: 0,
    linkHandling: 'inline',
    supportsThreads: false,
    contentTypes: [
      'whatsapp_broadcast', 'whatsapp_channel',
      'image_single', 'video_short', 'document',
    ],
  },
  threads: {
    slug: 'threads',
    captionLimit: 500,
    maxImages: 20,
    maxVideoSec: 300,
    maxFileSizeMb: 1024,
    minImageWidth: 320,
    minImageHeight: 320,
    hashtagLimit: 0,
    linkHandling: 'inline',
    supportsThreads: true,
    contentTypes: ['text_only', 'image_single', 'image_carousel', 'video_short'],
  },
};

/**
 * Registry lookup by slug. Tolerates both slug forms in circulation: the public
 * catalogue / DB uses the underscored slug (`google_business`) while the OAuth,
 * queue and publishing layers use the hyphenated form (`google-business`). Any
 * caller — whichever world it lives in — resolves the same capability. Returns
 * undefined for a genuinely unknown platform.
 */
export function getPlatformCapability(slug: string): PlatformCapability | undefined {
  return (
    PLATFORM_CAPABILITIES[slug as PlatformSlug] ??
    PLATFORM_CAPABILITIES[slug.replace(/-/g, '_') as PlatformSlug]
  );
}

/**
 * Base limits lifted by the platform's premium overrides when `isPremium`.
 * The natural home for Phase 1's `resolveEffectiveLimits(platform, account)`.
 */
export function resolveEffectiveLimits(
  slug: string,
  isPremium = false,
): PlatformCapabilityLimits | undefined {
  const cap = getPlatformCapability(slug);
  if (!cap) return undefined;
  const base: PlatformCapabilityLimits = {
    captionLimit: cap.captionLimit,
    maxImages: cap.maxImages,
    maxVideoSec: cap.maxVideoSec,
    maxFileSizeMb: cap.maxFileSizeMb,
    minImageWidth: cap.minImageWidth,
    minImageHeight: cap.minImageHeight,
    hashtagLimit: cap.hashtagLimit,
  };
  return isPremium && cap.premium ? { ...base, ...cap.premium } : base;
}

/** Effective caption limit only — the common case for counters and AI prompts. */
export function getCaptionLimit(slug: string, isPremium = false): number {
  return resolveEffectiveLimits(slug, isPremium)?.captionLimit ?? DEFAULT_CAPTION_LIMIT;
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 2 — per-platform content adaptation storage contract
 *
 * A post carries one master `caption`. Any platform may override it with a
 * tailored caption and, on threading platforms (X, Threads), a pre-split
 * `segments` list. Overrides live under `platform_options[slug]` — keyed by the
 * CANONICAL platform slug (`google-business`, not a worker's local `gbp` key) —
 * alongside that platform's other extras (pageId, event data, …).
 *
 * These resolvers fall back to the master caption when no override exists, so
 * publish behaviour is unchanged until a caller writes an adaptation. Phase 3
 * (AI adapt) writes into this contract; Phase 4 (threaded workers) reads it.
 * ──────────────────────────────────────────────────────────────────────── */

/** Per-platform caption/thread override stored under `platform_options[slug]`. */
export interface PlatformAdaptation {
  /** Tailored caption for this platform; falls back to the master caption. */
  caption?: string;
  /** Pre-split thread segments for threading platforms (X, Threads). */
  segments?: string[];
}

/** Keys the adaptation contract owns inside `platform_options[slug]`. */
export const PLATFORM_ADAPTATION_KEYS = ['caption', 'segments'] as const;

type PlatformOptionsMap =
  | Record<string, Record<string, unknown> | undefined>
  | null
  | undefined;

/** Resolve the caption to publish on `slug`: per-platform override ?? master. */
export function resolvePlatformCaption(
  masterCaption: string,
  platformOptions: PlatformOptionsMap,
  slug: string,
): string {
  const override = platformOptions?.[slug]?.caption;
  return typeof override === 'string' && override.trim().length > 0
    ? override
    : masterCaption;
}

/** Pre-split thread segments for `slug`, or null when none / not a thread platform. */
export function resolvePlatformSegments(
  platformOptions: PlatformOptionsMap,
  slug: string,
): string[] | null {
  if (!getPlatformCapability(slug)?.supportsThreads) return null;
  const segments = platformOptions?.[slug]?.segments;
  return Array.isArray(segments) &&
    segments.length > 0 &&
    segments.every((s) => typeof s === 'string')
    ? (segments as string[])
    : null;
}

/**
 * Fold per-platform adaptations into an existing `platform_options` map without
 * disturbing each platform's non-adaptation extras. Blank captions and empty
 * segment lists are stripped so storage stays clean (publish falls back to the
 * master caption). Returns a new object; inputs are not mutated.
 */
export function mergePlatformAdaptations(
  existing: PlatformOptionsMap,
  adaptations: Record<string, PlatformAdaptation> | null | undefined,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [slug, opts] of Object.entries(existing ?? {})) {
    if (opts) out[slug] = { ...opts };
  }
  for (const [slug, adaptation] of Object.entries(adaptations ?? {})) {
    const target = { ...(out[slug] ?? {}) };
    const caption = adaptation?.caption;
    if (typeof caption === 'string' && caption.trim().length > 0) target.caption = caption;
    else delete target.caption;
    const segments = adaptation?.segments;
    if (Array.isArray(segments) && segments.length > 0) target.segments = segments;
    else delete target.segments;
    out[slug] = target;
  }
  return out;
}
