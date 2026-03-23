import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty({ enum: ['monthly', 'yearly'] })
  @IsIn(['monthly', 'yearly'])
  interval!: 'monthly' | 'yearly';

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsString()
  workspaceId!: string;
}
