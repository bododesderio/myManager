import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorCodeDto {
  @ApiProperty({ description: 'TOTP verification code' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
