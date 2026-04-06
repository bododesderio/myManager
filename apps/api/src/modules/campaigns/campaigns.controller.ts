import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { getRequestUserId, getRequestWorkspaceId } from '../../common/http/request-context';
import { CampaignsService } from './campaigns.service';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns in workspace' })
  async list(@Query('workspaceId') workspaceId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.campaignsService.list(workspaceId, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a campaign' })
  async create(@Req() req: Request, @Body() body: {
    workspaceId: string; name: string; description?: string; startDate: string; endDate: string;
    color?: string; hashtags?: string[];
  }) {
    return this.campaignsService.create(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details with posts' })
  async getById(@Param('id') id: string) { return this.campaignsService.getById(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.campaignsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  async delete(@Param('id') id: string) { return this.campaignsService.delete(id); }

  @Post(':id/posts')
  @ApiOperation({ summary: 'Add posts to campaign' })
  async addPosts(@Param('id') id: string, @Body() body: { postIds: string[] }) {
    return this.campaignsService.addPosts(id, body.postIds);
  }

  @Delete(':id/posts/:postId')
  @ApiOperation({ summary: 'Remove post from campaign' })
  async removePost(@Param('id') id: string, @Param('postId') postId: string) {
    return this.campaignsService.removePost(id, postId);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  async getAnalytics(@Param('id') id: string) { return this.campaignsService.getAnalytics(id); }
}
