import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { getRequestWorkspaceId } from '../../common/http/request-context';
import { ListeningService } from './listening.service';

@ApiTags('Listening')
@ApiBearerAuth()
@Controller('listening')
export class ListeningController {
  constructor(private readonly listeningService: ListeningService) {}

  @Get('terms')
  @ApiOperation({ summary: 'List monitoring terms' })
  async listTerms(@Query('workspaceId') workspaceId: string) { return this.listeningService.listTerms(workspaceId); }

  @Post('terms')
  @ApiOperation({ summary: 'Add a monitoring term' })
  async addTerm(@Req() req: Request, @Body() body: { workspaceId: string; term: string; platforms: string[] }) {
    return this.listeningService.addTerm({
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Delete('terms/:id')
  @ApiOperation({ summary: 'Remove a monitoring term' })
  async removeTerm(@Param('id') id: string) { return this.listeningService.removeTerm(id); }

  @Get('mentions')
  @ApiOperation({ summary: 'List brand mentions' })
  async listMentions(@Query('workspaceId') workspaceId: string, @Query('platform') platform?: string,
    @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.listeningService.listMentions(workspaceId, platform, page, limit);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get mention analytics (sentiment, volume over time)' })
  async getAnalytics(@Query('workspaceId') workspaceId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.listeningService.getAnalytics(workspaceId, startDate, endDate);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending topics related to monitored terms' })
  async getTrending(@Query('workspaceId') workspaceId: string) { return this.listeningService.getTrending(workspaceId); }
}
