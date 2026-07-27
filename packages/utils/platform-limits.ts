import { Platform, ContentType } from '@mymanager/types';
import { PLATFORM_CAPABILITIES } from '@mymanager/constants';

/**
 * Adapter over the canonical capability registry in `@mymanager/constants`.
 * This file holds NO platform data of its own — it reshapes the registry into
 * the legacy `PlatformLimitSpec` surface that existing consumers expect. Edit
 * limits in `packages/constants/platform-capabilities.ts`, never here.
 */

export interface PlatformLimitSpec {
  max_caption_chars: number;
  max_images: number;
  max_file_size_mb: number;
  max_video_duration_seconds: number;
  min_image_width: number;
  min_image_height: number;
  supported_content_types: ContentType[];
}

function toSpec(platform: Platform): PlatformLimitSpec {
  const cap = PLATFORM_CAPABILITIES[platform];
  return {
    max_caption_chars: cap.captionLimit,
    max_images: cap.maxImages,
    max_file_size_mb: cap.maxFileSizeMb,
    max_video_duration_seconds: cap.maxVideoSec,
    min_image_width: cap.minImageWidth,
    min_image_height: cap.minImageHeight,
    supported_content_types: cap.contentTypes as unknown as ContentType[],
  };
}

export class PlatformLimitsService {
  static getLimits(platform: Platform): PlatformLimitSpec {
    return toSpec(platform);
  }

  static isContentTypeSupported(platform: Platform, contentType: ContentType): boolean {
    return (PLATFORM_CAPABILITIES[platform].contentTypes as string[]).includes(contentType);
  }

  static getMaxCaptionChars(platform: Platform): number {
    return PLATFORM_CAPABILITIES[platform].captionLimit;
  }

  static getSupportedPlatformsForContentType(contentType: ContentType): Platform[] {
    return Object.values(PLATFORM_CAPABILITIES)
      .filter((cap) => (cap.contentTypes as string[]).includes(contentType))
      .map((cap) => cap.slug as unknown as Platform);
  }
}
