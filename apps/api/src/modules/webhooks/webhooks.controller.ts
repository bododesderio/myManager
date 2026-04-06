import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { getRequestUserId, getRequestWorkspaceId } from '../../common/http/request-context';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators/public.decorator';

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
    return this.webhooksService.create(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
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

  @Public()
  @Post('social/:platform')
  @ApiOperation({ summary: 'Receive inbound social platform webhooks' })
  async receiveSocialWebhook(
    @Param('platform') platform: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-mymanager-webhook-timestamp') timestamp: string,
    @Headers('x-mymanager-webhook-signature') signature: string,
  ) {
    this.verifyForwardedWebhook(body, timestamp, signature);
    return this.webhooksService.handleIncomingSocialWebhook(platform, body);
  }

  private verifyForwardedWebhook(body: Record<string, unknown>, timestamp?: string, signature?: string) {
    const secret = process.env.WEBHOOK_FORWARD_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Webhook forward secret not configured');
    }
    if (!timestamp || !signature) {
      throw new UnauthorizedException('Missing internal webhook signature');
    }

    const issuedAt = Number(timestamp);
    if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Expired webhook signature');
    }

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(body)}`)
      .digest('hex');

    const signatureBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
      throw new UnauthorizedException('Invalid internal webhook signature');
    }
  }
}
