import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeysService } from './api-keys.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys for workspace' })
  async list(@Query('workspaceId') workspaceId: string) { return this.apiKeysService.list(workspaceId); }

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  async create(@Req() req: Request, @Body() body: { workspaceId: string; name: string; scopes: string[] }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.apiKeysService.create(userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key details (key itself not returned)' })
  async getById(@Param('id') id: string) { return this.apiKeysService.getById(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key name or scopes' })
  async update(@Param('id') id: string, @Body() body: { name?: string; scopes?: string[] }) {
    return this.apiKeysService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revoke(@Param('id') id: string) { return this.apiKeysService.revoke(id); }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate an API key (generates new key, invalidates old)' })
  async rotate(@Param('id') id: string) { return this.apiKeysService.rotate(id); }
}
