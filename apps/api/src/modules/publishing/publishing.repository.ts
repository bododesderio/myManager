import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PublishingRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findPostById(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        media: { include: { media_asset: true }, orderBy: { sort_order: 'asc' } },
      },
    });
  }

  async updatePostStatus(id: string, status: string) {
    return this.prisma.post.update({
      where: { id },
      data: {
        status: status as PostStatus,
        ...(status === 'PUBLISHED' ? { published_at: new Date() } : {}),
      },
    });
  }

  async findActiveSocialAccount(workspaceId: string, platform: string) {
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

  async findPlatformResults(postId: string) {
    return this.prisma.postPlatformResult.findMany({
      where: { post_id: postId },
    });
  }

  async findPublishHistory(workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = {
      workspace_id: workspaceId,
      status: { in: ['PUBLISHED', 'FAILED', 'PARTIALLY_PUBLISHED'] as PostStatus[] },
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { published_at: 'desc' },
        include: {
          platform_results: true,
          user: { select: { id: true, name: true, avatar_url: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return [posts, total];
  }
}
