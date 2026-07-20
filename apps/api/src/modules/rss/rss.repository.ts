import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RssRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.rssFeed.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.

  async findById(id: string, workspaceId: string) {
    return this.prisma.rssFeed.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.rssFeed.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.rssFeed.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }
  async create(data: Record<string, unknown>) { return this.prisma.rssFeed.create({ data } as unknown as Parameters<typeof this.prisma.rssFeed.create>[0]); }

  async isItemImported(feedId: string, guid: string): Promise<boolean> {
    const count = await this.prisma.rssImportedItem.count({ where: { rss_feed_id: feedId, guid } });
    return count > 0;
  }

  async createImportedItem(feedId: string, data: { guid: string; title: string; url: string; imported_at?: Date }) {
    return this.prisma.rssImportedItem.create({ data: { rss_feed_id: feedId, ...data } });
  }

  async findItems(feedId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { rss_feed_id: feedId };
    const [items, total] = await Promise.all([
      this.prisma.rssImportedItem.findMany({ where, skip: offset, take: limit, orderBy: { imported_at: 'desc' } }),
      this.prisma.rssImportedItem.count({ where }),
    ]);
    return [items, total];
  }

  async findAllActiveFeeds() {
    return this.prisma.rssFeed.findMany({ where: { is_active: true } });
  }
}
