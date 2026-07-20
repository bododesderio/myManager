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

  /**
   * Hashtag performance, aggregated in the database.
   *
   * This previously loaded every hashtag with every linked post and every
   * analytics row, then summed in Node (docs/audit-2026-07-20.md §M7). A
   * workspace with a few thousand tagged posts pulled the entire object graph
   * into memory to produce a handful of totals.
   *
   * Same output shape and ordering as before; the arithmetic just happens where
   * the data already is. COUNT(DISTINCT ph.post_id) preserves the old
   * "one count per linked post" semantics despite the analytics join
   * multiplying rows (a post has one analytics row per platform).
   */
  async getHashtagPerformance(workspaceId: string, startDate: Date, endDate: Date) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        text: string;
        post_count: bigint;
        total_engagements: bigint;
        total_reach: bigint;
      }>
    >`
      SELECT
        h.id,
        h.text,
        COUNT(DISTINCT ph.post_id) AS post_count,
        COALESCE(SUM(a.likes + a.comments + a.shares), 0) AS total_engagements,
        COALESCE(SUM(a.reach), 0) AS total_reach
      FROM hashtags h
      LEFT JOIN post_hashtags ph ON ph.hashtag_id = h.id
      LEFT JOIN post_analytics a
        ON a.post_id = ph.post_id
       AND a.synced_at >= ${startDate}
       AND a.synced_at <= ${endDate}
      WHERE h.workspace_id = ${workspaceId}
      GROUP BY h.id, h.text
      ORDER BY total_engagements DESC
    `;

    return rows.map((r) => {
      const postCount = Number(r.post_count);
      const totalEngagements = Number(r.total_engagements);
      return {
        id: r.id,
        text: r.text,
        postCount,
        totalEngagements,
        totalReach: Number(r.total_reach),
        avgEngagements: postCount > 0 ? Math.round(totalEngagements / postCount) : 0,
      };
    });
  }
}
