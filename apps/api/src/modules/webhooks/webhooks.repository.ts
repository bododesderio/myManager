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

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.
  async findById(id: string, workspaceId: string) {
    return this.prisma.webhookEndpoint.findFirst({
      where: { id, workspace_id: workspaceId },
    });
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

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: {
    url?: string;
    events?: string[];
    secret?: string;
    is_active?: boolean;
  }) {
    const result = await this.prisma.webhookEndpoint.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.webhookEndpoint.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

  async findActiveByWorkspaceAndEvent(workspaceId: string, event: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { workspace_id: workspaceId, is_active: true, events: { has: event } },
    });
  }

  /** Scoped through the parent endpoint — delivery rows contain request/response payloads. */
  async findDeliveries(endpointId: string, workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    // Scoped through the parent endpoint — delivery rows contain request and
    // response payloads, so a bare endpoint UUID must not be enough to read them.
    const where = { webhook_endpoint_id: endpointId, endpoint: { workspace_id: workspaceId } };
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
