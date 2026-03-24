import { Controller, Get, Query, Param, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get workspace analytics overview' })
  async getOverview(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getOverview(workspaceId, startDate, endDate);
  }

  @Get('platform/:platform')
  @ApiOperation({ summary: 'Get analytics for a specific platform' })
  async getPlatformAnalytics(
    @Param('platform') platform: string,
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getPlatformAnalytics(workspaceId, platform, startDate, endDate);
  }

  @Get('posts/top')
  @ApiOperation({ summary: 'Get top performing posts' })
  async getTopPosts(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy: string = 'engagements',
  ) {
    return this.analyticsService.getTopPosts(workspaceId, startDate, endDate, limit, sortBy);
  }

  @Get('best-times')
  @ApiOperation({ summary: 'Get best posting times per platform' })
  async getBestTimes(
    @Query('workspaceId') workspaceId: string,
    @Query('platform') platform?: string,
  ) {
    return this.analyticsService.getBestTimes(workspaceId, platform);
  }

  @Get('hashtags')
  @ApiOperation({ summary: 'Get hashtag performance analytics' })
  async getHashtagAnalytics(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getHashtagAnalytics(workspaceId, startDate, endDate);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily aggregated analytics' })
  async getDailyAnalytics(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('platform') platform?: string,
  ) {
    return this.analyticsService.getDailyAnalytics(workspaceId, startDate, endDate, platform);
  }

  @Get('engagement-rate')
  @ApiOperation({ summary: 'Get engagement rate trends' })
  async getEngagementRate(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getEngagementRateTrends(workspaceId, startDate, endDate);
  }
}
