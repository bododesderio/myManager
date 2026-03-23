import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ListeningRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findTerms(workspaceId: string) { return this.prisma.listeningTerm.findMany({ where: { workspace_id: workspaceId } }); }
  async createTerm(data: Record<string, unknown>) { return this.prisma.listeningTerm.create({ data } as unknown as Parameters<typeof this.prisma.listeningTerm.create>[0]); }
  async deleteTerm(id: string) { return this.prisma.listeningTerm.delete({ where: { id } }); }

  async findMentions(workspaceId: string, platform: string | undefined, offset: number, limit: number): Promise<[unknown[], number]> {
    const terms = await this.prisma.listeningTerm.findMany({ where: { workspace_id: workspaceId }, select: { id: true } });
    const termIds = terms.map((t) => t.id);
    const where: Record<string, unknown> = { listening_term_id: { in: termIds } };
    if (platform) where.platform = platform;
    const [mentions, total] = await Promise.all([
      this.prisma.mentionEvent.findMany({ where, skip: offset, take: limit, orderBy: { fetched_at: 'desc' } }),
      this.prisma.mentionEvent.count({ where }),
    ]);
    return [mentions, total];
  }

  async getMentionAnalytics(workspaceId: string, startDate: Date, endDate: Date) {
    const terms = await this.prisma.listeningTerm.findMany({ where: { workspace_id: workspaceId }, select: { id: true } });
    const termIds = terms.map((t) => t.id);
    return this.prisma.mentionAnalyticsDaily.findMany({
      where: { listening_term_id: { in: termIds }, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
  }

  async getTrendingTopics(workspaceId: string) {
    const terms = await this.prisma.listeningTerm.findMany({ where: { workspace_id: workspaceId }, select: { id: true } });
    const termIds = terms.map((t) => t.id);
    const recentMentions = await this.prisma.mentionEvent.findMany({
      where: { listening_term_id: { in: termIds }, fetched_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { text: true, platform: true },
    });

    const wordCounts: Record<string, number> = {};
    for (const m of recentMentions) {
      const words = (m.text || '').split(/\s+/).filter((w: string) => w.startsWith('#'));
      for (const w of words) {
        wordCounts[w.toLowerCase()] = (wordCounts[w.toLowerCase()] || 0) + 1;
      }
    }

    return Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 20).map(([topic, count]) => ({ topic, count }));
  }
}
