import { Platform, ContentType } from '@mymanager/types';

export interface PlatformLimitSpec {
  max_caption_chars: number;
  max_images: number;
  max_file_size_mb: number;
  max_video_duration_seconds: number;
  min_image_width: number;
  min_image_height: number;
  supported_content_types: ContentType[];
}

const PLATFORM_LIMITS: Record<Platform, PlatformLimitSpec> = {
  [Platform.FACEBOOK]: {
    max_caption_chars: 63206,
    max_images: 10,
    max_file_size_mb: 100,
    max_video_duration_seconds: 14400,
    min_image_width: 200,
    min_image_height: 200,
    supported_content_types: [
      ContentType.TEXT_ONLY, ContentType.IMAGE_SINGLE, ContentType.IMAGE_CAROUSEL,
      ContentType.VIDEO_LONG, ContentType.VIDEO_SHORT, ContentType.IMAGE_STORY, ContentType.VIDEO_STORY,
    ],
  },
  [Platform.INSTAGRAM]: {
    max_caption_chars: 2200,
    max_images: 10,
    max_file_size_mb: 100,
    max_video_duration_seconds: 5400,
    min_image_width: 320,
    min_image_height: 320,
    supported_content_types: [
      ContentType.IMAGE_SINGLE, ContentType.IMAGE_CAROUSEL,
      ContentType.VIDEO_SHORT, ContentType.IMAGE_STORY, ContentType.VIDEO_STORY,
    ],
  },
  [Platform.X]: {
    max_caption_chars: 280,
    max_images: 4,
    max_file_size_mb: 15,
    max_video_duration_seconds: 140,
    min_image_width: 200,
    min_image_height: 200,
    supported_content_types: [
      ContentType.TEXT_ONLY, ContentType.IMAGE_SINGLE, ContentType.VIDEO_SHORT,
    ],
  },
  [Platform.LINKEDIN]: {
    max_caption_chars: 3000,
    max_images: 9,
    max_file_size_mb: 200,
    max_video_duration_seconds: 600,
    min_image_width: 552,
    min_image_height: 276,
    supported_content_types: [
      ContentType.TEXT_ONLY, ContentType.IMAGE_SINGLE, ContentType.IMAGE_CAROUSEL,
      ContentType.VIDEO_LONG, ContentType.DOCUMENT,
    ],
  },
  [Platform.TIKTOK]: {
    max_caption_chars: 2200,
    max_images: 35,
    max_file_size_mb: 287,
    max_video_duration_seconds: 600,
    min_image_width: 360,
    min_image_height: 640,
    supported_content_types: [
      ContentType.VIDEO_SHORT, ContentType.VIDEO_LONG, ContentType.IMAGE_CAROUSEL,
    ],
  },
  [Platform.GOOGLE_BUSINESS]: {
    max_caption_chars: 1500,
    max_images: 1,
    max_file_size_mb: 25,
    max_video_duration_seconds: 0,
    min_image_width: 250,
    min_image_height: 250,
    supported_content_types: [
      ContentType.GBP_UPDATE, ContentType.GBP_EVENT, ContentType.GBP_OFFER, ContentType.GBP_PRODUCT,
    ],
  },
  [Platform.PINTEREST]: {
    max_caption_chars: 500,
    max_images: 1,
    max_file_size_mb: 32,
    max_video_duration_seconds: 900,
    min_image_width: 236,
    min_image_height: 354,
    supported_content_types: [
      ContentType.PIN_IMAGE, ContentType.PIN_VIDEO, ContentType.PIN_PRODUCT,
    ],
  },
  [Platform.YOUTUBE]: {
    max_caption_chars: 5000,
    max_images: 0,
    max_file_size_mb: 256000,
    max_video_duration_seconds: 43200,
    min_image_width: 0,
    min_image_height: 0,
    supported_content_types: [
      ContentType.VIDEO_LONG, ContentType.VIDEO_SHORT,
    ],
  },
  [Platform.WHATSAPP]: {
    max_caption_chars: 4096,
    max_images: 1,
    max_file_size_mb: 100,
    max_video_duration_seconds: 120,
    min_image_width: 0,
    min_image_height: 0,
    supported_content_types: [
      ContentType.WHATSAPP_BROADCAST, ContentType.WHATSAPP_CHANNEL,
      ContentType.IMAGE_SINGLE, ContentType.VIDEO_SHORT, ContentType.DOCUMENT,
    ],
  },
  [Platform.THREADS]: {
    max_caption_chars: 500,
    max_images: 20,
    max_file_size_mb: 100,
    max_video_duration_seconds: 300,
    min_image_width: 320,
    min_image_height: 320,
    supported_content_types: [
      ContentType.TEXT_ONLY, ContentType.IMAGE_SINGLE, ContentType.IMAGE_CAROUSEL, ContentType.VIDEO_SHORT,
    ],
  },
};

export class PlatformLimitsService {
  static getLimits(platform: Platform): PlatformLimitSpec {
    return PLATFORM_LIMITS[platform];
  }

  static isContentTypeSupported(platform: Platform, contentType: ContentType): boolean {
    return PLATFORM_LIMITS[platform].supported_content_types.includes(contentType);
  }

  static getMaxCaptionChars(platform: Platform): number {
    return PLATFORM_LIMITS[platform].max_caption_chars;
  }

  static getSupportedPlatformsForContentType(contentType: ContentType): Platform[] {
    return Object.entries(PLATFORM_LIMITS)
      .filter(([, spec]) => spec.supported_content_types.includes(contentType))
      .map(([platform]) => platform as Platform);
  }
}
