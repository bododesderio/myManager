import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

interface RssImportJobData { feedId: string; }

export class RssImporterWorker {
  constructor(private readonly prisma: PrismaService) {}

  async process(job: Job<RssImportJobData>): Promise<void> {
    const { feedId } = job.data;
    const feed = await this.prisma.rssFeed.findUnique({ where: { id: feedId } });
    if (!feed) return;

    const response = await axios.get(feed.url, { timeout: 15000 });
    const items = this.parseRssItems(response.data);

    for (const item of items) {
      const guid = item.guid || item.link;
      const exists = await this.prisma.rssImportedItem.count({ where: { rss_feed_id: feedId, guid } });
      if (exists > 0) continue;

      await this.prisma.rssImportedItem.create({
        data: { rss_feed_id: feedId, guid, title: item.title, url: item.link, imported_at: item.pubDate ? new Date(item.pubDate) : new Date() },
      });
    }

    await this.prisma.rssFeed.update({ where: { id: feedId }, data: { last_fetched: new Date() } });
  }

  private parseRssItems(xml: string): { title: string; link: string; guid: string; pubDate: string }[] {
    const items: { title: string; link: string; guid: string; pubDate: string }[] = [];
    const matches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];
    for (const item of matches) {
      items.push({
        title: (item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || '').trim(),
        link: (item.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || '').trim(),
        guid: (item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || '').trim(),
        pubDate: (item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim(),
      });
    }
    return items;
  }
}
