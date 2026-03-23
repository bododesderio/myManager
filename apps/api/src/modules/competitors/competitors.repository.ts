import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CompetitorsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) { return this.prisma.competitorProfile.findMany({ where: { workspace_id: workspaceId } }); }
  async findById(id: string) { return this.prisma.competitorProfile.findUnique({ where: { id }, include: { snapshots: { take: 7, orderBy: { date: 'desc' } } } }); }
  async create(data: Record<string, unknown>) { return this.prisma.competitorProfile.create({ data } as unknown as Parameters<typeof this.prisma.competitorProfile.create>[0]); }
  async delete(id: string) { return this.prisma.competitorProfile.delete({ where: { id } }); }

  async findSnapshots(competitorId: string, days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);
    return this.prisma.competitorSnapshot.findMany({
      where: { competitor_profile_id: competitorId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }

  async getOwnMetrics(workspaceId: string, platform: string) {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.prisma.workspaceAnalyticsDaily.aggregate({
      where: { workspace_id: workspaceId, platform, date: { gte: thirtyDaysAgo } },
      _sum: { total_impressions: true, total_engagements: true, total_reach: true },
      _avg: { total_engagements: true },
    });
  }

  async getCompetitorMetrics(workspaceId: string, platform: string) {
    const competitors = await this.prisma.competitorProfile.findMany({ where: { workspace_id: workspaceId, platform } });
    const results = [];
    for (const c of competitors) {
      const latest = await this.prisma.competitorSnapshot.findFirst({ where: { competitor_profile_id: c.id }, orderBy: { date: 'desc' } });
      results.push({ ...c, latestSnapshot: latest });
    }
    return results;
  }
}
