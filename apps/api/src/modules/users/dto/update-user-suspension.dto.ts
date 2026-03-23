import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserSuspensionDto {
  @ApiProperty({ description: 'Whether the user account should be suspended' })
  @IsBoolean()
  suspended!: boolean;
}
