/**
 * @author Bodo Desderio <rooiboktechltd@gmail.com>
 * @copyright 2026 Rooibok Technologies. All rights reserved.
 */
import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsDateString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  caption?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  firstCommentText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  platformOptions?: Record<string, unknown>;

  /** Per-platform caption/segment overrides, keyed by canonical platform slug. */
  @ApiPropertyOptional({
    description: 'Per-platform caption/segment overrides, keyed by platform slug',
  })
  @IsOptional()
  @IsObject()
  platformCaptions?: Record<string, { caption?: string; segments?: string[] }>;
}
