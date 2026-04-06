import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { getRequestUserId, getRequestWorkspaceId } from '../../common/http/request-context';
import { RssService } from './rss.service';

@ApiTags('RSS')
@ApiBearerAuth()
@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get()
  @ApiOperation({ summary: 'List RSS feeds for workspace' })
  async list(@Query('workspaceId') workspaceId: string) { return this.rssService.list(workspaceId); }

  @Post()
  @ApiOperation({ summary: 'Add an RSS feed' })
  async add(@Req() req: Request, @Body() body: { workspaceId: string; url: string; name?: string; autoPost: boolean; platforms?: string[] }) {
    return this.rssService.add(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RSS feed details with recent items' })
  async getById(@Param('id') id: string) { return this.rssService.getById(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update RSS feed settings' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.rssService.update(id, body); }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove RSS feed' })
  async remove(@Param('id') id: string) { return this.rssService.remove(id); }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Manually trigger RSS feed sync' })
  async sync(@Param('id') id: string) { return this.rssService.syncNow(id); }

  @Get(':id/items')
  @ApiOperation({ summary: 'List imported items from RSS feed' })
  async listItems(@Param('id') id: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.rssService.listItems(id, page, limit);
  }
}
