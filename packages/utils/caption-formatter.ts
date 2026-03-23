import { Platform } from '@mymanager/types';
import { PlatformLimitsService } from './platform-limits';

export interface UtmConfig {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function injectUtmParams(url: string, config: UtmConfig): string {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set('utm_source', config.source);
  parsedUrl.searchParams.set('utm_medium', config.medium);
  if (config.campaign) parsedUrl.searchParams.set('utm_campaign', config.campaign);
  if (config.term) parsedUrl.searchParams.set('utm_term', config.term);
  if (config.content) parsedUrl.searchParams.set('utm_content', config.content);
  return parsedUrl.toString();
}

export function truncateCaption(caption: string, platform: Platform): string {
  const maxChars = PlatformLimitsService.getMaxCaptionChars(platform);
  if (caption.length <= maxChars) return caption;

  const ellipsis = '...';
  const truncated = caption.slice(0, maxChars - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + ellipsis;
  }

  return truncated + ellipsis;
}

export function formatCaptionForPlatform(
  caption: string,
  platform: Platform,
  options?: {
    linkUrl?: string;
    utmConfig?: UtmConfig;
    hashtags?: string[];
  },
): string {
  let formatted = caption;

  if (options?.hashtags?.length) {
    const hashtagString = options.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
    formatted = `${formatted}\n\n${hashtagString}`;
  }

  if (options?.linkUrl && options?.utmConfig) {
    const trackedUrl = injectUtmParams(options.linkUrl, {
      ...options.utmConfig,
      source: platform,
      medium: 'social',
    });
    formatted = `${formatted}\n\n${trackedUrl}`;
  } else if (options?.linkUrl) {
    formatted = `${formatted}\n\n${options.linkUrl}`;
  }

  return truncateCaption(formatted, platform);
}
