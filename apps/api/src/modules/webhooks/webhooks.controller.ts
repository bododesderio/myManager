import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints' })
  async list(@Query('workspaceId') workspaceId: string) { return this.webhooksService.list(workspaceId); }

  @Post()
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  async create(@Req() req: Request, @Body() body: {
    workspaceId: string; url: string; events: string[]; secret?: string;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.webhooksService.create(userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook endpoint details' })
  async getById(@Param('id') id: string) { return this.webhooksService.getById(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook endpoint' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.webhooksService.update(id, body); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  async deleteEndpoint(@Param('id') id: string) { return this.webhooksService.deleteEndpoint(id); }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'List recent webhook deliveries' })
  async listDeliveries(@Param('id') id: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.webhooksService.listDeliveries(id, page, limit);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test webhook delivery' })
  async test(@Param('id') id: string) { return this.webhooksService.sendTest(id); }

  @Post('deliveries/:deliveryId/retry')
  @ApiOperation({ summary: 'Retry a failed webhook delivery' })
  async retryDelivery(@Param('deliveryId') deliveryId: string) { return this.webhooksService.retryDelivery(deliveryId); }
}
