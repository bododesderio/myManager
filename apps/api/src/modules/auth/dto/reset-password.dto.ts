import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_RULES } from './register.dto';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  /**
   * Same policy as registration. Without it the signup rules were trivially
   * bypassable: register with a compliant password, then immediately reset to
   * a weak one. A password policy is only as strong as its weakest entry point.
   */
  @ApiProperty({
    description:
      'Minimum 8 characters, with at least one uppercase letter, one lowercase letter and one number.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_RULES[0][0], { message: PASSWORD_RULES[0][1] })
  @Matches(PASSWORD_RULES[1][0], { message: PASSWORD_RULES[1][1] })
  @Matches(PASSWORD_RULES[2][0], { message: PASSWORD_RULES[2][1] })
  password!: string;
}
