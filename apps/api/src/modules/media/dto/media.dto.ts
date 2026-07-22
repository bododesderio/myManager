import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

/**
 * Allowed MIME types for media uploads.
 */
// Images: broad modern coverage incl. HEIC/HEIF (default iPhone photos) and
// AVIF. SVG is intentionally excluded — it can carry scripts and is an XSS risk
// when served back. Videos: the formats the platforms actually accept.
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/tiff',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
] as const;

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Per-category size caps — videos get a much larger budget than images.
export const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_SIZE = 512 * 1024 * 1024; // 512 MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB
/** Absolute ceiling the DTO enforces; per-category limits are checked in the service. */
export const MAX_FILE_SIZE = MAX_VIDEO_SIZE;

/** The size cap that applies to a given content type. */
export function maxSizeForContentType(contentType: string): number {
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(contentType)) return MAX_VIDEO_SIZE;
  if ((ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(contentType)) return MAX_DOCUMENT_SIZE;
  return MAX_IMAGE_SIZE;
}

export class GetPresignedUploadUrlDto {
  @ApiProperty({ description: 'Workspace the media belongs to' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ description: 'Original file name including extension' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    enum: ALLOWED_MIME_TYPES,
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...ALLOWED_MIME_TYPES], {
    message: `contentType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  contentType!: AllowedMimeType;

  @ApiProperty({
    description: 'File size in bytes (images ≤25 MB, videos ≤512 MB)',
    example: 1048576,
  })
  @IsNumber()
  @Min(1, { message: 'fileSize must be at least 1 byte' })
  @Max(MAX_FILE_SIZE, {
    message: `fileSize must not exceed ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
  })
  fileSize!: number;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'ID of the media asset returned from the presigned upload step' })
  @IsString()
  @IsNotEmpty()
  mediaId!: string;

  @ApiProperty({ description: 'R2 / storage object key' })
  @IsString()
  @IsNotEmpty()
  r2Key!: string;
}

export class BulkDeleteMediaDto {
  @ApiProperty({
    description: 'Array of media asset IDs to delete',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'mediaIds must contain at least one ID' })
  @ArrayMaxSize(200, { message: 'mediaIds cannot contain more than 200 IDs per request' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  mediaIds!: string[];
}

export class ListMediaQueryDto {
  @ApiProperty({ description: 'Workspace ID to list media for' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ description: 'Filter by media type (e.g. image, video, document)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default 30)', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
