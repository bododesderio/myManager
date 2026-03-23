import { IsString, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkScheduleDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  @ArrayMinSize(1)
  posts!: Array<{ caption: string; platforms: string[]; contentType: string; scheduledAt?: string; mediaIds?: string[] }>;
}
