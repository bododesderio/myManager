import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async getAggregatedMetrics(workspaceId: string, startDate: Date, endDate: Date) {
    const result = await this.prisma.workspaceAnalyticsDaily.aggregate({
      where: {
        workspace_id: workspaceId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        total_reach: true,
        total_impressions: true,
        total_engagements: true,
        posts_count: true,
        follower_count: true,
      },
    });

    return {
      totalReach: result._sum.total_reach || 0,
      totalImpressions: result._sum.total_impressions || 0,
      totalEngagements: result._sum.total_engagements || 0,
      totalPostsCount: result._sum.posts_count || 0,
      totalFollowerCount: result._sum.follower_count || 0,
    };
  }

  async getDailyMetrics(workspaceId: string, startDate: Date, endDate: Date, platform?: string) {
    const where: Record<string, unknown> = { workspace_id: workspaceId, date: { gte: startDate, lte: endDate } };
    if (platform) where.platform = platform;

    return this.prisma.workspaceAnalyticsDaily.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async getPlatformBreakdown(workspaceId: string, startDate: Date, endDate: Date) {
    const results = await this.prisma.workspaceAnalyticsDaily.groupBy({
      by: ['platform'],
      where: { workspace_id: workspaceId, date: { gte: startDate, lte: endDate } },
      _sum: {
        total_reach: true,
        total_impressions: true,
        total_engagements: true,
        posts_count: true,
      },
    });

    return results.map((r) => ({
      platform: r.platform,
      reach: r._sum.total_reach || 0,
      impressions: r._sum.total_impressions || 0,
      engagements: r._sum.total_engagements || 0,
      postsCount: r._sum.posts_count || 0,
    }));
  }

  async getPlatformMetrics(workspaceId: string, platform: string, startDate: Date, endDate: Date) {
    return this.prisma.postAnalytics.findMany({
      where: {
        platform,
        post: { workspace_id: workspaceId },
        synced_at: { gte: startDate, lte: endDate },
      },
      include: {
        post: { select: { id: true, caption: true, content_type: true, published_at: true } },
      },
      orderBy: { synced_at: 'desc' },
    });
  }

  async getTopPerformingPosts(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    limit: number,
    sortBy: string,
  ) {
    const orderField = sortBy === 'reach' ? 'reach' : sortBy === 'clicks' ? 'clicks' : 'engagement_rate';

    return this.prisma.postAnalytics.findMany({
      where: {
        post: { workspace_id: workspaceId, published_at: { gte: startDate, lte: endDate } },
      },
      orderBy: { [orderField]: 'desc' },
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            platforms: true,
            content_type: true,
            published_at: true,
            media: { include: { media_asset: true }, take: 1 },
          },
        },
      },
    });
  }

  async getBestPostingTimes(workspaceId: string, platform?: string) {
    const where: Record<string, unknown> = { workspace_id: workspaceId };
    if (platform) where.platform = platform;

    return this.prisma.bestTime.findMany({
      where,
      orderBy: { score: 'desc' },
    });
  }

  async getHashtagPerformance(workspaceId: string, startDate: Date, endDate: Date) {
    const hashtags = await this.prisma.hashtag.findMany({
      where: { workspace_id: workspaceId },
      include: {
        post_hashtags: {
          include: {
            post: {
              include: {
                analytics: {
                  where: { synced_at: { gte: startDate, lte: endDate } },
                },
              },
            },
          },
        },
      },
    });

    return hashtags.map((h) => {
      let totalEngagements = 0;
      let totalReach = 0;
      let postCount = 0;

      for (const ph of h.post_hashtags) {
        postCount++;
        for (const a of ph.post.analytics) {
          totalEngagements += (a.likes + a.comments + a.shares) || 0;
          totalReach += a.reach || 0;
        }
      }

      return {
        id: h.id,
        text: h.text,
        postCount,
        totalEngagements,
        totalReach,
        avgEngagements: postCount > 0 ? Math.round(totalEngagements / postCount) : 0,
      };
    }).sort((a, b) => b.totalEngagements - a.totalEngagements);
  }
}
