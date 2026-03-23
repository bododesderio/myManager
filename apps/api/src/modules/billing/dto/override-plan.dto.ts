import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OverridePlanDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  overrideUntil?: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}
