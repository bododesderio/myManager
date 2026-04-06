import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { getRequestUserId, getRequestWorkspaceId } from '../../common/http/request-context';
import { BioPagesService } from './bio-pages.service';

@ApiTags('Bio Pages')
@Controller('bio-pages')
export class BioPagesController {
  constructor(private readonly bioPagesService: BioPagesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List bio pages for workspace' })
  async list(@Query('workspaceId') workspaceId: string) {
    return this.bioPagesService.listByWorkspace(workspaceId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a bio page' })
  async create(@Req() req: Request, @Body() body: {
    workspaceId: string; projectId?: string; slug: string; title: string;
    description?: string; theme?: Record<string, unknown>; links: Array<Record<string, unknown>>;
  }) {
    return this.bioPagesService.create(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get published bio page by slug (public)' })
  async getPublic(@Param('slug') slug: string) {
    return this.bioPagesService.getBySlug(slug);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bio page details' })
  async getById(@Param('id') id: string) { return this.bioPagesService.getById(id); }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bio page' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.bioPagesService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete bio page' })
  async delete(@Param('id') id: string) { return this.bioPagesService.delete(id); }

  @Post(':slug/click')
  @ApiOperation({ summary: 'Track link click event (public)' })
  async trackClick(@Param('slug') slug: string, @Body() body: { linkIndex: number; referrer?: string }) {
    return this.bioPagesService.trackClick(slug, body.linkIndex, body.referrer);
  }

  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bio page click analytics' })
  async getAnalytics(@Param('id') id: string, @Query('days') days: number = 30) {
    return this.bioPagesService.getAnalytics(id, days);
  }
}
