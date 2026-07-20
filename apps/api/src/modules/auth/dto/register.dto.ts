import {
  IsEmail,
  IsString,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Password policy (docs/audit-2026-07-20.md §Low — password policy).
 *
 * `packages/validators`' signupSchema already declared exactly this policy, but
 * nothing enforced it: the web app never imported the schema, and this DTO only
 * checked MinLength(8). A policy that exists solely as an unimported constant is
 * documentation, not a control.
 *
 * Kept in sync with packages/validators/user.schema.ts by hand — the API is
 * class-validator and the shared package is Zod, so they cannot share the
 * implementation without pulling Zod into every DTO. Change both together.
 */
export const PASSWORD_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/[A-Z]/, 'Password must contain at least one uppercase letter'],
  [/[a-z]/, 'Password must contain at least one lowercase letter'],
  [/[0-9]/, 'Password must contain at least one number'],
];

export class RegisterDto {
  @ApiProperty({ enum: ['individual', 'company'] })
  @IsIn(['individual', 'company'])
  accountType!: 'individual' | 'company';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  workspaceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  workspaceSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  teamSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referralSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  planSlug?: string;

  @ApiPropertyOptional({ enum: ['monthly', 'annual'] })
  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billingCycle?: 'monthly' | 'annual';
}
