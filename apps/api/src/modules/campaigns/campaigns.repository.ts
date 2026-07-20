import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CampaignsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { workspace_id: workspaceId };
    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where, skip: offset, take: limit, orderBy: { start_date: 'desc' },
        include: { _count: { select: { posts: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return [campaigns, total];
  }

  async findById(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: { campaign_posts: { include: { post: { include: { media: { include: { media_asset: true }, take: 1 }, platform_results: true } } } } },
    });
  }

  async create(data: Record<string, unknown>) { return this.prisma.campaign.create({ data } as unknown as Parameters<typeof this.prisma.campaign.create>[0]); }
  async update(id: string, data: Record<string, unknown>) { return this.prisma.campaign.update({ where: { id }, data }); }
  async delete(id: string) { return this.prisma.campaign.delete({ where: { id } }); }

  async addPosts(campaignId: string, postIds: string[]) {
    return this.prisma.campaignPost.createMany({
      data: postIds.map((postId) => ({ campaign_id: campaignId, post_id: postId })),
      skipDuplicates: true,
    });
  }

  async removePost(campaignId: string, postId: string) {
    return this.prisma.campaignPost.delete({ where: { campaign_id_post_id: { campaign_id: campaignId, post_id: postId } } });
  }

  /**
   * Campaign totals, aggregated in the database.
   *
   * Previously loaded every campaign post with its full analytics graph and
   * summed in Node (docs/audit-2026-07-20.md §M7). Identical output; the
   * arithmetic now happens where the rows already are, so memory is constant
   * rather than proportional to campaign size.
   */
  async getAnalytics(campaignId: string) {
    const [posts, sums] = await Promise.all([
      this.prisma.campaignPost.count({ where: { campaign_id: campaignId } }),
      this.prisma.postAnalytics.aggregate({
        where: { post: { campaign_posts: { some: { campaign_id: campaignId } } } },
        _sum: {
          reach: true,
          impressions: true,
          clicks: true,
          likes: true,
          comments: true,
          shares: true,
        },
      }),
    ]);

    const s = sums._sum;
    return {
      posts,
      reach: s.reach ?? 0,
      impressions: s.impressions ?? 0,
      // Engagement is a derived metric; summing the components separately and
      // adding three numbers is O(1), unlike summing per row in Node.
      engagements: (s.likes ?? 0) + (s.comments ?? 0) + (s.shares ?? 0),
      clicks: s.clicks ?? 0,
    };
  }
}
