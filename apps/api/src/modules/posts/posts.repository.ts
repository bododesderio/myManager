import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(
    workspaceId: string,
    filters: { status?: string; platform?: string; projectId?: string; campaignId?: string },
    offset: number,
    limit: number,
  ): Promise<[unknown[], number]> {
    const where: Record<string, unknown> = { workspace_id: workspaceId };
    if (filters.status) where.status = filters.status;
    if (filters.platform) where.platforms = { has: filters.platform };
    if (filters.projectId) where.project_id = filters.projectId;
    if (filters.campaignId) where.campaign_id = filters.campaignId;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          media: { include: { media_asset: true } },
          platform_results: true,
          user: { select: { id: true, name: true, avatar_url: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return [posts, total];
  }

  async findById(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        media: { include: { media_asset: true }, orderBy: { sort_order: 'asc' } },
        platform_results: true,
        post_hashtags: { include: { hashtag: true } },
        user: { select: { id: true, name: true, avatar_url: true } },
        analytics: true,
      },
    });
  }

  async create(data: {
    workspace_id: string;
    project_id?: string;
    user_id: string;
    caption: string;
    platforms: string[];
    content_type: string;
    status: string;
    scheduled_at: Date | null;
    link_url?: string;
    link_preview_override?: Record<string, any>;
    first_comment_text?: string;
    platform_options?: Record<string, any>;
  }) {
    return this.prisma.post.create({
      data: {
        workspace_id: data.workspace_id,
        project_id: data.project_id,
        user_id: data.user_id,
        caption: data.caption,
        platforms: data.platforms,
        content_type: data.content_type,
        status: data.status as PostStatus,
        scheduled_at: data.scheduled_at,
        link_url: data.link_url,
        link_preview_override: data.link_preview_override,
        first_comment_text: data.first_comment_text,
        platform_options: data.platform_options,
      },
    });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.post.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return this.prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DELETED' },
    });
  }

  async attachMedia(postId: string, mediaIds: string[]) {
    const data = mediaIds.map((media_asset_id, index) => ({
      post_id: postId,
      media_asset_id,
      sort_order: index,
    }));
    return this.prisma.postMedia.createMany({ data });
  }

  async attachHashtags(postId: string, hashtagIds: string[]) {
    const data = hashtagIds.map((hashtag_id) => ({ post_id: postId, hashtag_id }));
    return this.prisma.postHashtag.createMany({ data });
  }

  async createVersion(postId: string, data: { caption: string; platforms?: string[]; mediaIds?: string[] }) {
    const versionCount = await this.prisma.postVersion.count({ where: { post_id: postId } });
    if (versionCount >= 10) {
      const oldest = await this.prisma.postVersion.findFirst({
        where: { post_id: postId },
        orderBy: { created_at: 'asc' },
      });
      if (oldest) {
        await this.prisma.postVersion.delete({ where: { id: oldest.id } });
      }
    }
    return this.prisma.postVersion.create({
      data: {
        post_id: postId,
        version: versionCount + 1,
        caption: data.caption,
        media_ids: data.mediaIds || [],
        metadata: { platforms: data.platforms },
      },
    });
  }

  async findVersions(postId: string) {
    return this.prisma.postVersion.findMany({
      where: { post_id: postId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAnalytics(postId: string) {
    return this.prisma.postAnalytics.findMany({
      where: { post_id: postId },
      orderBy: { synced_at: 'desc' },
    });
  }

  async findSocialAccountForPlatform(workspaceId: string, platform: string) {
    return this.prisma.socialAccount.findFirst({
      where: { workspace_id: workspaceId, platform_id: platform, is_active: true },
    });
  }

  async updatePlatformResult(
    postId: string,
    platform: string,
    status: string,
    platformPostId: string | null,
    errorMessage?: string,
  ) {
    return this.prisma.postPlatformResult.upsert({
      where: { post_id_platform: { post_id: postId, platform } },
      update: { status, platform_post_id: platformPostId, error_message: errorMessage },
      create: { post_id: postId, platform, status, platform_post_id: platformPostId, error_message: errorMessage },
    });
  }

  async findForCalendar(workspaceId: string, startDate: Date, endDate: Date) {
    return this.prisma.post.findMany({
      where: {
        workspace_id: workspaceId,
        OR: [
          { scheduled_at: { gte: startDate, lte: endDate } },
          { published_at: { gte: startDate, lte: endDate } },
          { created_at: { gte: startDate, lte: endDate }, status: 'DRAFT' },
        ],
      },
      include: {
        media: { include: { media_asset: true }, take: 1 },
      },
      orderBy: { scheduled_at: 'asc' },
    });
  }

  async findFeed(workspaceId: string, cursor?: string, limit: number = 20) {
    const where: Record<string, unknown> = { workspace_id: workspaceId };
    if (cursor) {
      where.created_at = { lt: new Date(cursor) };
    }

    const posts = await this.prisma.post.findMany({
      where,
      take: limit + 1,
      orderBy: { created_at: 'desc' },
      include: {
        media: { include: { media_asset: true }, take: 1 },
        platform_results: true,
        user: { select: { id: true, name: true, avatar_url: true } },
      },
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1].created_at.toISOString() : null;

    return { data, nextCursor, hasMore };
  }
}
