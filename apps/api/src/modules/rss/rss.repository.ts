import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RssRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.rssFeed.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  async findById(id: string) { return this.prisma.rssFeed.findUnique({ where: { id } }); }
  async create(data: Record<string, unknown>) { return this.prisma.rssFeed.create({ data } as unknown as Parameters<typeof this.prisma.rssFeed.create>[0]); }
  async update(id: string, data: Record<string, unknown>) { return this.prisma.rssFeed.update({ where: { id }, data }); }
  async delete(id: string) { return this.prisma.rssFeed.delete({ where: { id } }); }

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
