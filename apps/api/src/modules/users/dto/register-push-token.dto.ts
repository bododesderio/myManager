import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPushTokenDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  platform!: string;

  @ApiProperty()
  @IsString()
  deviceId!: string;
}
