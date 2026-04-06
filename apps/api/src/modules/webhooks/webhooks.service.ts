import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhooksRepository } from './webhooks.repository';
import { AuditService } from '../audit/audit.service';

interface IncomingSocialComment {
  platformUserId: string;
  platformCommentId: string;
  platformPostId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  text: string;
  isReply: boolean;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly repository: WebhooksRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(workspaceId: string) {
    return this.repository.findByWorkspace(workspaceId);
  }

  async create(
    userId: string,
    data: { workspaceId: string; url: string; events: string[]; secret?: string },
  ) {
    const secret = data.secret || crypto.randomBytes(32).toString('hex');
    const endpoint = await this.repository.create({
      workspace_id: data.workspaceId,
      url: data.url,
      events: data.events,
      secret,
      is_active: true,
    });

    await this.auditService.log('webhook_endpoint_created', {
      userId,
      workspaceId: data.workspaceId,
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      metadata: { url: data.url, events: data.events },
    });

    return endpoint;
  }

  async getById(id: string) {
    const endpoint = await this.repository.findById(id);
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');
    return endpoint;
  }

  async update(id: string, data: Record<string, unknown>) {
    const endpoint = await this.getById(id);
    const updated = await this.repository.update(id, {
      url: typeof data.url === 'string' ? data.url : undefined,
      events: Array.isArray(data.events)
        ? data.events.filter((event): event is string => typeof event === 'string')
        : undefined,
      secret: typeof data.secret === 'string' ? data.secret : undefined,
      is_active: typeof data.isActive === 'boolean'
        ? data.isActive
        : typeof data.is_active === 'boolean'
          ? data.is_active
          : undefined,
    });

    await this.auditService.log('webhook_endpoint_updated', {
      workspaceId: endpoint.workspace_id,
      resourceType: 'webhook_endpoint',
      resourceId: updated.id,
      metadata: {
        url: updated.url,
        events: updated.events,
        isActive: updated.is_active,
      },
    });

    return updated;
  }

  async deleteEndpoint(id: string) {
    const endpoint = await this.getById(id);
    await this.repository.delete(id);
    await this.auditService.log('webhook_endpoint_deleted', {
      workspaceId: endpoint.workspace_id,
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      metadata: { url: endpoint.url },
    });
    return { message: 'Webhook endpoint deleted' };
  }

  async listDeliveries(endpointId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [deliveries, total] = await this.repository.findDeliveries(endpointId, offset, limit);
    return {
      data: deliveries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async sendTest(endpointId: string) {
    const endpoint = await this.repository.findById(endpointId);
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');

    const payload = {
      event: 'test',
      data: { message: 'This is a test webhook delivery' },
      timestamp: new Date().toISOString(),
    };
    const delivery = await this.repository.createDelivery({
      webhook_endpoint_id: endpoint.id,
      event: 'test',
      payload,
      attempts: 0,
      max_attempts: 6,
    });

    await this.deliverWebhook(endpoint, delivery.id, payload);

    return { message: 'Test webhook delivered', deliveryId: delivery.id };
  }

  async retryDelivery(deliveryId: string) {
    const delivery = await this.repository.findDeliveryById(deliveryId);
    if (!delivery) throw new NotFoundException('Webhook delivery not found');

    await this.repository.updateDelivery(delivery.id, {
      next_retry_at: null,
      delivered_at: null,
    });

    await this.deliverWebhook(
      delivery.endpoint,
      delivery.id,
      delivery.payload as Record<string, unknown>,
      delivery.attempts,
      delivery.max_attempts,
    );

    return { message: 'Delivery retry completed', deliveryId: delivery.id };
  }

  async dispatchEvent(workspaceId: string, event: string, data: Record<string, unknown>) {
    const endpoints = await this.repository.findActiveByWorkspaceAndEvent(workspaceId, event);
    for (const endpoint of endpoints) {
      const payload = { event, data, timestamp: new Date().toISOString() };
      const delivery = await this.repository.createDelivery({
        webhook_endpoint_id: endpoint.id,
        event,
        payload,
        attempts: 0,
        max_attempts: 6,
      });
      await this.deliverWebhook(endpoint, delivery.id, payload);
    }
  }

  async handleIncomingSocialWebhook(platform: string, payload: Record<string, unknown>) {
    const normalizedPlatform = platform.toLowerCase();
    const comments = this.extractIncomingComments(normalizedPlatform, payload);
    const platformUserIds = Array.from(new Set(comments.map((comment) => comment.platformUserId)));
    const accounts = platformUserIds.length > 0
      ? await this.repository.findSocialAccountsByPlatformUserIds(normalizedPlatform, platformUserIds)
      : [];
    const accountMap = new Map(accounts.map((account) => [account.platform_user_id, account]));
    let storedCount = 0;

    for (const comment of comments) {
      const account = accountMap.get(comment.platformUserId);
      if (!account) {
        continue;
      }

      await this.repository.upsertSocialComment({
        workspace_id: account.workspace_id,
        social_account_id: account.id,
        platform: normalizedPlatform,
        platform_comment_id: comment.platformCommentId,
        platform_post_id: comment.platformPostId,
        author_name: comment.authorName,
        author_avatar_url: comment.authorAvatarUrl ?? null,
        text: comment.text,
        is_reply: comment.isReply,
      });
      storedCount += 1;
    }

    await this.auditService.log(`social_webhook_received:${platform}`, {
      resourceType: 'social_webhook',
      metadata: {
        platform: normalizedPlatform,
        storedCount,
        payload,
      },
    });

    return {
      status: 'accepted',
      platform: normalizedPlatform,
      received: comments.length,
      stored: storedCount,
    };
  }

  private signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private async deliverWebhook(
    endpoint: { id: string; url: string; secret: string },
    deliveryId: string,
    payload: Record<string, unknown>,
    previousAttempts: number = 0,
    maxAttempts: number = 6,
  ) {
    const payloadString = JSON.stringify(payload);
    const signature = this.signPayload(payloadString, endpoint.secret);
    const attempts = previousAttempts + 1;

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-mymanager-signature': signature,
          'x-mymanager-event': String(payload.event ?? 'unknown'),
        },
        body: payloadString,
      });

      const responseBody = await response.text();
      await this.repository.updateDelivery(deliveryId, {
        attempts,
        response_status: response.status,
        response_body: responseBody.slice(0, 4000),
        delivered_at: response.ok ? new Date() : null,
        next_retry_at: !response.ok && attempts < maxAttempts
          ? this.calculateNextRetry(attempts)
          : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown webhook delivery error';
      this.logger.warn(`Webhook delivery ${deliveryId} failed: ${message}`);
      await this.repository.updateDelivery(deliveryId, {
        attempts,
        response_status: null,
        response_body: message.slice(0, 4000),
        delivered_at: null,
        next_retry_at: attempts < maxAttempts ? this.calculateNextRetry(attempts) : null,
      });
    }
  }

  private calculateNextRetry(attempts: number) {
    const delayMinutes = Math.min(Math.pow(2, attempts - 1), 60);
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }

  private extractIncomingComments(platform: string, payload: Record<string, unknown>) {
    const normalized = this.extractNormalizedComment(payload);
    if (normalized) {
      return [normalized];
    }

    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    const comments: IncomingSocialComment[] = [];

    for (const entry of entries) {
      const entryRecord = this.asRecord(entry);
      const platformUserId = this.getString(entryRecord.id)
        ?? this.getString(entryRecord.platformUserId);
      if (!platformUserId) {
        continue;
      }

      const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];
      for (const change of changes) {
        const changeRecord = this.asRecord(change);
        const value = this.asRecord(changeRecord.value);
        const item = this.getString(value.item);
        const platformCommentId = this.getString(value.comment_id)
          ?? this.getString(value.id);
        const text = this.getString(value.message)
          ?? this.getString(value.text);

        if (!platformCommentId || !text) {
          continue;
        }

        if (item && item !== 'comment') {
          continue;
        }

        const from = this.asRecord(value.from);
        comments.push({
          platformUserId,
          platformCommentId,
          platformPostId: this.getString(value.post_id)
            ?? this.getString(value.media_id)
            ?? platformCommentId,
          authorName: this.getString(from.name) ?? `${platform} user`,
          authorAvatarUrl: this.getString(from.picture),
          text,
          isReply: !!this.getString(value.parent_id),
        });
      }
    }

    return comments;
  }

  private extractNormalizedComment(payload: Record<string, unknown>): IncomingSocialComment | null {
    const platformUserId = this.getString(payload.platformUserId);
    const platformCommentId = this.getString(payload.platformCommentId);
    const text = this.getString(payload.text);

    if (!platformUserId || !platformCommentId || !text) {
      return null;
    }

    return {
      platformUserId,
      platformCommentId,
      platformPostId: this.getString(payload.platformPostId) ?? platformCommentId,
      authorName: this.getString(payload.authorName) ?? 'Unknown',
      authorAvatarUrl: this.getString(payload.authorAvatarUrl),
      text,
      isReply: Boolean(payload.isReply),
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {};
  }

  private getString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
