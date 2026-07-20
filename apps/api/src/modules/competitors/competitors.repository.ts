import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CompetitorsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) { return this.prisma.competitorProfile.findMany({ where: { workspace_id: workspaceId } }); }
  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.
  async findById(id: string, workspaceId: string) {
    return this.prisma.competitorProfile.findFirst({
      where: { id, workspace_id: workspaceId },
      include: { snapshots: { take: 7, orderBy: { date: 'desc' } } },
    });
  }

  async create(data: Record<string, unknown>) { return this.prisma.competitorProfile.create({ data } as unknown as Parameters<typeof this.prisma.competitorProfile.create>[0]); }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.competitorProfile.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

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

  /**
   * Competitors with their most recent snapshot.
   *
   * Was an N+1: one query for the list, then one findFirst per competitor. Now a
   * single nested read — Prisma emits one query per relation, not one per row,
   * so this is 2 queries regardless of how many competitors are tracked.
   */
  async getCompetitorMetrics(workspaceId: string, platform: string) {
    const competitors = await this.prisma.competitorProfile.findMany({
      where: { workspace_id: workspaceId, platform },
      include: {
        snapshots: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    // Preserve the original shape: `latestSnapshot`, not a `snapshots` array.
    return competitors.map(({ snapshots, ...competitor }) => ({
      ...competitor,
      latestSnapshot: snapshots[0] ?? null,
    }));
  }
}
