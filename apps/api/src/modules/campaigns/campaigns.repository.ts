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

  async getAnalytics(campaignId: string) {
    const posts = await this.prisma.campaignPost.findMany({
      where: { campaign_id: campaignId },
      include: { post: { include: { analytics: true } } },
    });

    const totals = { posts: posts.length, reach: 0, impressions: 0, engagements: 0, clicks: 0 };
    for (const cp of posts) {
      for (const a of cp.post.analytics) {
        totals.reach += a.reach || 0;
        totals.impressions += a.impressions || 0;
        totals.engagements += (a.likes + a.comments + a.shares) || 0;
        totals.clicks += a.clicks || 0;
      }
    }
    return totals;
  }
}
