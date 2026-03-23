import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ required: false, description: 'Optional TOTP code for two-factor login' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totp_code?: string;
}
