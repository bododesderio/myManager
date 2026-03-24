import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PostsService } from './posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  SchedulePostDto,
  BulkScheduleDto,
  BulkDeletePostsDto,
} from './dto';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts in workspace' })
  async listPosts(
    @Query('workspaceId') workspaceId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('projectId') projectId?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.postsService.list(workspaceId, { status, platform, projectId, campaignId }, safePage, safeLimit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  async createPost(
    @Req() req: Request,
    @Body() body: CreatePostDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.postsService.create(userId, body);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get posts for calendar view' })
  async getCalendar(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.postsService.getCalendarView(workspaceId, startDate, endDate);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get post feed with recent activity' })
  async getFeed(
    @Query('workspaceId') workspaceId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.postsService.getFeed(workspaceId, cursor, safeLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post details' })
  async getPost(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.update(id, body as Record<string, any>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  async deletePost(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.delete(id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a post immediately' })
  async publishNow(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.postsService.publishNow(id, userId);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule a post for later' })
  async schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SchedulePostDto,
  ) {
    return this.postsService.schedule(id, body.scheduledAt);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a post' })
  async duplicate(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.postsService.duplicate(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get post version history' })
  async getVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getVersionHistory(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get post analytics per platform' })
  async getPostAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getPostAnalytics(id);
  }

  @Post('bulk/schedule')
  @ApiOperation({ summary: 'Bulk schedule posts from CSV data' })
  async bulkSchedule(
    @Req() req: Request,
    @Body() body: BulkScheduleDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.postsService.bulkSchedule(userId, body.workspaceId, body.posts);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete posts' })
  async bulkDelete(@Body() body: BulkDeletePostsDto) {
    return this.postsService.bulkDelete(body.postIds);
  }
}
