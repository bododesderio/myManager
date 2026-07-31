/**
 * @author Bodo Desderio <rooiboktechltd@gmail.com>
 * @copyright 2026 Rooibok Technologies. All rights reserved.
 */
import {
  resolvePlatformCaption,
  resolvePlatformSegments,
  mergePlatformAdaptations,
  getPlatformCapability,
  getCaptionLimit,
} from '@mymanager/constants';

describe('registry slug-form tolerance (GBP underscore vs hyphen)', () => {
  it('resolves the GBP capability from either slug form', () => {
    expect(getPlatformCapability('google_business')?.slug).toBe('google_business');
    expect(getPlatformCapability('google-business')?.slug).toBe('google_business');
  });

  it('returns GBP’s real caption limit (1500), not the 2200 default, for the hyphen form', () => {
    expect(getCaptionLimit('google-business')).toBe(1500);
    expect(getCaptionLimit('google_business')).toBe(1500);
  });

  it('still returns undefined for a genuinely unknown platform', () => {
    expect(getPlatformCapability('myspace')).toBeUndefined();
  });
});

describe('per-platform adaptation contract (Phase 2)', () => {
  describe('resolvePlatformCaption', () => {
    const master = 'master caption';

    it('returns the per-platform override when present', () => {
      const opts = { x: { caption: 'x-tailored' } };
      expect(resolvePlatformCaption(master, opts, 'x')).toBe('x-tailored');
    });

    it('falls back to master when the slug has no override', () => {
      expect(resolvePlatformCaption(master, { x: { caption: 'x' } }, 'linkedin')).toBe(master);
    });

    it('falls back to master for blank / whitespace overrides', () => {
      expect(resolvePlatformCaption(master, { x: { caption: '   ' } }, 'x')).toBe(master);
      expect(resolvePlatformCaption(master, { x: { caption: '' } }, 'x')).toBe(master);
    });

    it('tolerates null / undefined option maps', () => {
      expect(resolvePlatformCaption(master, null, 'x')).toBe(master);
      expect(resolvePlatformCaption(master, undefined, 'x')).toBe(master);
    });
  });

  describe('resolvePlatformSegments', () => {
    it('returns segments on a threading platform', () => {
      const opts = { x: { segments: ['one', 'two'] } };
      expect(resolvePlatformSegments(opts, 'x')).toEqual(['one', 'two']);
    });

    it('returns null on a non-threading platform even if segments exist', () => {
      const opts = { facebook: { segments: ['one', 'two'] } };
      expect(resolvePlatformSegments(opts, 'facebook')).toBeNull();
    });

    it('returns null for empty or malformed segment lists', () => {
      expect(resolvePlatformSegments({ x: { segments: [] } }, 'x')).toBeNull();
      expect(resolvePlatformSegments({ x: { segments: [1, 2] as unknown as string[] } }, 'x')).toBeNull();
    });
  });

  describe('mergePlatformAdaptations', () => {
    it('preserves each platform’s non-adaptation extras', () => {
      const existing = { 'google-business': { post_type: 'EVENT', event_title: 'Launch' } };
      const merged = mergePlatformAdaptations(existing, {
        'google-business': { caption: 'GBP copy' },
      });
      expect(merged['google-business']).toEqual({
        post_type: 'EVENT',
        event_title: 'Launch',
        caption: 'GBP copy',
      });
    });

    it('strips blank captions and empty segment lists', () => {
      const merged = mergePlatformAdaptations(
        { x: { caption: 'stale', segments: ['a'] } },
        { x: { caption: '  ', segments: [] } },
      );
      expect(merged.x.caption).toBeUndefined();
      expect(merged.x.segments).toBeUndefined();
    });

    it('does not mutate its inputs', () => {
      const existing = { x: { caption: 'old' } };
      const adaptations = { x: { caption: 'new' } };
      mergePlatformAdaptations(existing, adaptations);
      expect(existing.x.caption).toBe('old');
      expect(adaptations.x.caption).toBe('new');
    });

    it('handles empty / nullish inputs', () => {
      expect(mergePlatformAdaptations(null, null)).toEqual({});
      expect(mergePlatformAdaptations(undefined, { x: { caption: 'hi' } })).toEqual({
        x: { caption: 'hi' },
      });
    });
  });
});
