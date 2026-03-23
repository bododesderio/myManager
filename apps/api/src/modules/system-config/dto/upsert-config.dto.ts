import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertConfigDto {
  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({ description: 'Configuration category (e.g. "email", "payment", "general")' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({ description: 'Whether the value should be encrypted at rest', default: true })
  @IsOptional()
  @IsBoolean()
  is_secret?: boolean;
}
