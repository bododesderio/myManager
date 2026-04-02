import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhooksRepository } from './webhooks.repository';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly repository: WebhooksRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(workspaceId: string) { return this.repository.findByWorkspace(workspaceId); }

  async create(userId: string, data: { workspaceId: string; url: string; events: string[]; secret?: string }) {
    const secret = data.secret || crypto.randomBytes(32).toString('hex');
    return this.repository.create({ ...data, secret, createdBy: userId, isActive: true });
  }

  async getById(id: string) {
    const endpoint = await this.repository.findById(id);
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');
    return endpoint;
  }

  async update(id: string, data: Record<string, unknown>) { return this.repository.update(id, data); }
  async deleteEndpoint(id: string) { await this.repository.delete(id); return { message: 'Webhook endpoint deleted' }; }

  async listDeliveries(endpointId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [deliveries, total] = await this.repository.findDeliveries(endpointId, offset, limit);
    return { data: deliveries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async sendTest(endpointId: string) {
    const endpoint = await this.repository.findById(endpointId);
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');

    const payload = { event: 'test', data: { message: 'This is a test webhook delivery' }, timestamp: new Date().toISOString() };
    const signature = this.signPayload(JSON.stringify(payload), endpoint.secret);

    await this.repository.createDelivery({
      endpointId, event: 'test', payload, signature, status: 'pending',
    });

    return { message: 'Test webhook queued for delivery' };
  }

  async retryDelivery(deliveryId: string) {
    await this.repository.updateDelivery(deliveryId, { status: 'pending', retryCount: { increment: 1 } });
    return { message: 'Delivery retry queued' };
  }

  async dispatchEvent(workspaceId: string, event: string, data: Record<string, unknown>) {
    const endpoints = await this.repository.findActiveByWorkspaceAndEvent(workspaceId, event);
    for (const endpoint of endpoints) {
      const payload = { event, data, timestamp: new Date().toISOString() };
      const signature = this.signPayload(JSON.stringify(payload), endpoint.secret);
      await this.repository.createDelivery({ endpointId: endpoint.id, event, payload, signature, status: 'pending' });
    }
  }

  async handleIncomingSocialWebhook(platform: string, payload: Record<string, unknown>) {
    await this.auditService.log(`social_webhook_received:${platform}`, {
      resourceType: 'social_webhook',
      metadata: {
        platform,
        payload,
      },
    });

    return { status: 'accepted', platform };
  }

  private signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
