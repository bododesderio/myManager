import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PublishingService } from './publishing.service';

@ApiTags('Publishing')
@ApiBearerAuth()
@Controller('publishing')
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Post('dispatch/:postId')
  @ApiOperation({ summary: 'Dispatch a post for publishing to all selected platforms' })
  async dispatch(@Param('postId') postId: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.publishingService.dispatchPost(postId, userId);
  }

  @Post('retry/:postId/:platform')
  @ApiOperation({ summary: 'Retry failed publishing for a specific platform' })
  async retry(
    @Param('postId') postId: string,
    @Param('platform') platform: string,
  ) {
    return this.publishingService.retryPlatform(postId, platform);
  }

  @Get('queue/status')
  @ApiOperation({ summary: 'Get publishing queue status for workspace' })
  async getQueueStatus(@Query('workspaceId') workspaceId: string) {
    return this.publishingService.getQueueStatus(workspaceId);
  }

  @Get('status/:postId')
  @ApiOperation({ summary: 'Get real-time publishing status per platform' })
  async getPublishStatus(@Param('postId') postId: string) {
    return this.publishingService.getPostPublishStatus(postId);
  }

  @Post('cancel/:postId')
  @ApiOperation({ summary: 'Cancel a queued or scheduled post' })
  async cancel(@Param('postId') postId: string) {
    return this.publishingService.cancelPost(postId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get publishing history for workspace' })
  async getHistory(
    @Query('workspaceId') workspaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.publishingService.getPublishHistory(workspaceId, page, limit);
  }
}
