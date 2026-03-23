import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ApprovalsService } from './approvals.service';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List posts pending approval' })
  async listPending(
    @Query('workspaceId') workspaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.approvalsService.listPending(workspaceId, page, limit);
  }

  @Post(':postId/submit')
  @ApiOperation({ summary: 'Submit a post for approval' })
  async submitForApproval(@Param('postId') postId: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.approvalsService.submitForApproval(postId, userId);
  }

  @Post(':postId/approve')
  @ApiOperation({ summary: 'Approve a post' })
  async approve(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Body() body: { comment?: string },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.approvalsService.approve(postId, userId, body.comment);
  }

  @Post(':postId/reject')
  @ApiOperation({ summary: 'Request revisions on a post' })
  async reject(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Body() body: { comment: string },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.approvalsService.requestRevision(postId, userId, body.comment);
  }

  @Post(':postId/comments')
  @ApiOperation({ summary: 'Add inline comment on a post caption' })
  async addComment(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Body() body: { text: string; selectionStart?: number; selectionEnd?: number },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.approvalsService.addComment(postId, userId, body);
  }

  @Get(':postId/comments')
  @ApiOperation({ summary: 'Get inline comments for a post' })
  async getComments(@Param('postId') postId: string) {
    return this.approvalsService.getComments(postId);
  }

  @Get(':postId/history')
  @ApiOperation({ summary: 'Get approval event history for a post' })
  async getHistory(@Param('postId') postId: string) {
    return this.approvalsService.getHistory(postId);
  }
}
