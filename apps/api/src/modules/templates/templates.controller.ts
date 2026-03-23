import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List post templates' })
  async list(@Query('workspaceId') workspaceId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.templatesService.list(workspaceId, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post template' })
  async create(@Req() req: Request, @Body() body: {
    workspaceId: string; name: string; caption: string; platforms: string[];
    contentType: string; hashtagIds?: string[]; platformOptions?: Record<string, unknown>;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.templatesService.create(userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template details' })
  async getById(@Param('id') id: string) { return this.templatesService.getById(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update a template' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.templatesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  async delete(@Param('id') id: string) { return this.templatesService.delete(id); }

  @Post(':id/create-post')
  @ApiOperation({ summary: 'Create a post from a template' })
  async createFromTemplate(@Param('id') id: string, @Req() req: Request, @Body() body: { scheduledAt?: string }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.templatesService.createPostFromTemplate(id, userId, body.scheduledAt);
  }
}
