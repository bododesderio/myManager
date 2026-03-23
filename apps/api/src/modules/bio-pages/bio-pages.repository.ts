import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BioPagesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.bioPage.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  async findById(id: string) { return this.prisma.bioPage.findUnique({ where: { id } }); }

  async findBySlug(slug: string) { return this.prisma.bioPage.findUnique({ where: { slug } }); }

  async create(data: Record<string, unknown>) { return this.prisma.bioPage.create({ data } as unknown as Parameters<typeof this.prisma.bioPage.create>[0]); }

  async update(id: string, data: Record<string, unknown>) { return this.prisma.bioPage.update({ where: { id }, data }); }

  async delete(id: string) { return this.prisma.bioPage.delete({ where: { id } }); }

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
