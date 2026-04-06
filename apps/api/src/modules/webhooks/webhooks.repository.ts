import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkspace(workspaceId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.webhookEndpoint.findUnique({ where: { id } });
  }

  async create(data: {
    workspace_id: string;
    url: string;
    events: string[];
    secret: string;
    is_active: boolean;
  }) {
    return this.prisma.webhookEndpoint.create({ data });
  }

  async update(id: string, data: {
    url?: string;
    events?: string[];
    secret?: string;
    is_active?: boolean;
  }) {
    return this.prisma.webhookEndpoint.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  async findActiveByWorkspaceAndEvent(workspaceId: string, event: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { workspace_id: workspaceId, is_active: true, events: { has: event } },
    });
  }

  async findDeliveries(endpointId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { webhook_endpoint_id: endpointId };
    const [deliveries, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);
    return [deliveries, total];
  }

  async findDeliveryById(id: string) {
    return this.prisma.webhookDelivery.findUnique({
      where: { id },
      include: { endpoint: true },
    });
  }

  async createDelivery(data: {
    webhook_endpoint_id: string;
    event: string;
    payload: Record<string, unknown>;
    attempts?: number;
    max_attempts?: number;
    response_status?: number | null;
    response_body?: string | null;
    next_retry_at?: Date | null;
    delivered_at?: Date | null;
  }) {
    return this.prisma.webhookDelivery.create({
      data: {
        ...data,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
  }

  async updateDelivery(id: string, data: {
    attempts?: number;
    response_status?: number | null;
    response_body?: string | null;
    next_retry_at?: Date | null;
    delivered_at?: Date | null;
  }) {
    return this.prisma.webhookDelivery.update({ where: { id }, data });
  }

  async findSocialAccountByPlatformUserId(platformId: string, platformUserId: string) {
    return this.prisma.socialAccount.findFirst({
      where: {
        platform_id: platformId,
        platform_user_id: platformUserId,
        is_active: true,
      },
    });
  }

  async findSocialAccountsByPlatformUserIds(platformId: string, platformUserIds: string[]) {
    return this.prisma.socialAccount.findMany({
      where: {
        platform_id: platformId,
        platform_user_id: { in: platformUserIds },
        is_active: true,
      },
    });
  }

  async upsertSocialComment(data: {
    workspace_id: string;
    social_account_id: string;
    platform: string;
    platform_comment_id: string;
    platform_post_id: string;
    author_name: string;
    author_avatar_url?: string | null;
    text: string;
    sentiment?: string | null;
    is_reply?: boolean;
  }) {
    return this.prisma.socialComment.upsert({
      where: {
        platform_platform_comment_id: {
          platform: data.platform,
          platform_comment_id: data.platform_comment_id,
        },
      },
      update: {
        platform_post_id: data.platform_post_id,
        author_name: data.author_name,
        author_avatar_url: data.author_avatar_url ?? null,
        text: data.text,
        sentiment: data.sentiment ?? null,
        is_reply: data.is_reply ?? false,
      },
      create: {
        workspace_id: data.workspace_id,
        social_account_id: data.social_account_id,
        platform: data.platform,
        platform_comment_id: data.platform_comment_id,
        platform_post_id: data.platform_post_id,
        author_name: data.author_name,
        author_avatar_url: data.author_avatar_url ?? null,
        text: data.text,
        sentiment: data.sentiment ?? null,
        is_reply: data.is_reply ?? false,
      },
    });
  }
}
