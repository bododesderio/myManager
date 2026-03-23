import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppleCallbackDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  idToken!: string;
}
