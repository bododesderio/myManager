import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsArray,
  ArrayNotEmpty,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

/**
 * Allowed MIME types for media uploads.
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** 50 MB in bytes */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
    description: 'File size in bytes (max 50 MB)',
    example: 1048576,
  })
  @IsNumber()
  @Min(1, { message: 'fileSize must be at least 1 byte' })
  @Max(MAX_FILE_SIZE, {
    message: `fileSize must not exceed ${MAX_FILE_SIZE} bytes (50 MB)`,
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
