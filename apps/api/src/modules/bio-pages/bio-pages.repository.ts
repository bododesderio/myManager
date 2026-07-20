import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BioPagesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.bioPage.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.

  async findById(id: string, workspaceId: string) {
    return this.prisma.bioPage.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.bioPage.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.bioPage.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

  async findBySlug(slug: string) { return this.prisma.bioPage.findUnique({ where: { slug } }); }

  async create(data: Record<string, unknown>) { return this.prisma.bioPage.create({ data } as unknown as Parameters<typeof this.prisma.bioPage.create>[0]); }

  async incrementViews(id: string) {
    return this.prisma.bioPage.update({ where: { id }, data: { } });
  }

  async recordClick(bioPageId: string, linkIndex: number, referrer?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.bioLinkEvent.create({
      data: { bio_page_id: bioPageId, link_index: linkIndex, referrer, date: today },
    });
  }

  async getClickAnalytics(bioPageId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.prisma.bioLinkEvent.groupBy({
      by: ['link_index', 'date'],
      where: { bio_page_id: bioPageId, date: { gte: since } },
      _count: { id: true },
      orderBy: { date: 'asc' },
    });
  }
}
