import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'Whether the user should be a superadmin' })
  @IsBoolean()
  is_superadmin!: boolean;
}
