import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanDto {
  @ApiProperty()
  @IsString()
  planId!: string;
}
