import { Platform, ContentType } from '@mymanager/types';
import { PlatformLimitsService } from './platform-limits';

export interface MediaFile {
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
}

export interface ContentValidation {
  platform: Platform;
  contentType: ContentType;
  mediaFiles: MediaFile[];
  caption: string;
  platformOptions: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export function validateContent(input: ContentValidation): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const limits = PlatformLimitsService.getLimits(input.platform);

  if (!PlatformLimitsService.isContentTypeSupported(input.platform, input.contentType)) {
    errors.push({
      field: 'contentType',
      message: `${input.contentType} is not supported on ${input.platform}`,
      code: 'UNSUPPORTED_CONTENT_TYPE',
    });
  }

  if (input.caption.length > limits.max_caption_chars) {
    errors.push({
      field: 'caption',
      message: `Caption exceeds ${limits.max_caption_chars} character limit for ${input.platform}`,
      code: 'CAPTION_TOO_LONG',
    });
  }

  if (limits.max_images > 0 && input.mediaFiles.length > limits.max_images) {
    errors.push({
      field: 'mediaFiles',
      message: `Maximum ${limits.max_images} files allowed for ${input.platform}`,
      code: 'TOO_MANY_FILES',
    });
  }

  for (const file of input.mediaFiles) {
    const maxBytes = limits.max_file_size_mb * 1024 * 1024;
    if (file.size_bytes > maxBytes) {
      errors.push({
        field: 'mediaFiles',
        message: `File exceeds ${limits.max_file_size_mb}MB limit for ${input.platform}`,
        code: 'FILE_TOO_LARGE',
      });
    }

    if (file.duration_seconds && limits.max_video_duration_seconds > 0 && file.duration_seconds > limits.max_video_duration_seconds) {
      errors.push({
        field: 'mediaFiles',
        message: `Video exceeds ${limits.max_video_duration_seconds}s limit for ${input.platform}`,
        code: 'VIDEO_TOO_LONG',
      });
    }

    if (file.width && limits.min_image_width > 0 && file.width < limits.min_image_width) {
      warnings.push({
        field: 'mediaFiles',
        message: `Image width ${file.width}px is below recommended ${limits.min_image_width}px for ${input.platform}`,
      });
    }
  }

  if (input.platform === Platform.GOOGLE_BUSINESS && !input.platformOptions?.post_type) {
    errors.push({ field: 'platformOptions.post_type', message: 'Google Business requires a post type', code: 'MISSING_POST_TYPE' });
  }

  if (input.platform === Platform.YOUTUBE && !input.platformOptions?.title) {
    errors.push({ field: 'platformOptions.title', message: 'YouTube requires a video title', code: 'MISSING_TITLE' });
  }

  if (input.platform === Platform.PINTEREST && !input.platformOptions?.board_id) {
    errors.push({ field: 'platformOptions.board_id', message: 'Pinterest requires a board selection', code: 'MISSING_BOARD' });
  }

  if (input.platform === Platform.WHATSAPP && !input.platformOptions?.recipient_list_id) {
    errors.push({ field: 'platformOptions.recipient_list_id', message: 'WhatsApp requires a recipient list', code: 'MISSING_RECIPIENT_LIST' });
  }

  return { valid: errors.length === 0, errors, warnings };
}
