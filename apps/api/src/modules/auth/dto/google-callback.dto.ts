import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleCallbackDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  redirectUri!: string;
}
