import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { CommentsService } from './comments.service';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List social comments (inbox)' })
  async list(
    @Query('workspaceId') workspaceId: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.commentsService.list(workspaceId, { platform, status }, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment details with thread' })
  async getById(@Param('id') id: string) { return this.commentsService.getById(id); }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a social comment' })
  async reply(@Param('id') id: string, @Req() req: Request, @Body() body: { text: string }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.commentsService.reply(id, userId, body.text);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign comment to team member' })
  async assign(@Param('id') id: string, @Req() req: Request, @Body() body: { assigneeId: string }) {
    const assignerId = (req as unknown as { user: { id: string } }).user.id;
    return this.commentsService.assign(id, body.assigneeId, assignerId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update comment status (open, resolved, archived)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.commentsService.updateStatus(id, body.status);
  }

  @Delete(':id/hide')
  @ApiOperation({ summary: 'Hide a comment on the platform' })
  async hide(@Param('id') id: string) { return this.commentsService.hide(id); }

  @Get('stats')
  @ApiOperation({ summary: 'Get comment inbox statistics' })
  async getStats(@Query('workspaceId') workspaceId: string) {
    return this.commentsService.getStats(workspaceId);
  }
}
