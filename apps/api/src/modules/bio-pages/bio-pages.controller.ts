import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { getRequestUserId, getRequestWorkspaceId } from '../../common/http/request-context';
import { Public } from '../../common/decorators/public.decorator';
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

  /**
   * Genuinely anonymous: a link-in-bio page is shared with the public, so
   * requiring a JWT here made the feature non-functional (every visitor got 401).
   *
   * Safe to expose because the service reads through the published-only,
   * field-restricted lookup — drafts are invisible and no tenant identifiers are
   * returned. Throttled because it is an unauthenticated database read.
   */
  @Public()
  @Throttle({ long: { ttl: 60000, limit: 120 } })
  @Get('public/:slug')
  @ApiOperation({ summary: 'Get published bio page by slug (public, no auth)' })
  async getPublic(@Param('slug') slug: string) {
    return this.bioPagesService.getBySlug(slug);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bio page details' })
  async getById(@Param('id') id: string, @Req() req: Request) {
    return this.bioPagesService.getById(id, getRequestWorkspaceId(req));
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bio page' })
  async update(@Param('id') id: string, @Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.bioPagesService.update(id, getRequestWorkspaceId(req), body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete bio page' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    return this.bioPagesService.delete(id, getRequestWorkspaceId(req));
  }

  /**
   * Anonymous WRITE, so throttled harder than the read: every request inserts a
   * bio_link_events row. Without a limit this is a free write amplifier and lets
   * anyone inflate another workspace's click analytics.
   */
  @Public()
  @Throttle({ long: { ttl: 60000, limit: 30 } })
  @Post(':slug/click')
  @ApiOperation({ summary: 'Track link click event (public, no auth)' })
  async trackClick(@Param('slug') slug: string, @Body() body: { linkIndex: number; referrer?: string }) {
    return this.bioPagesService.trackClick(slug, body.linkIndex, body.referrer);
  }

  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bio page click analytics' })
  async getAnalytics(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('days') days: number = 30,
  ) {
    return this.bioPagesService.getAnalytics(id, getRequestWorkspaceId(req), days);
  }
}
