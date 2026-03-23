import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { RssRepository } from './rss.repository';

@Injectable()
export class RssService {
  constructor(private readonly repository: RssRepository) {}

  async list(workspaceId: string) { return this.repository.findByWorkspace(workspaceId); }

  async add(userId: string, data: { workspaceId: string; url: string; name?: string; autoPost: boolean; platforms?: string[] }) {
    const feedInfo = await this.fetchFeedMeta(data.url);
    return this.repository.create({
      workspaceId: data.workspaceId,
      url: data.url,
      name: data.name || feedInfo.title || data.url,
      autoPost: data.autoPost,
      platforms: data.platforms || [],
      createdBy: userId,
    });
  }

  async getById(id: string) {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('RSS feed not found');
    return feed;
  }

  async update(id: string, data: Record<string, unknown>) { return this.repository.update(id, data); }

  async remove(id: string) { await this.repository.delete(id); return { message: 'RSS feed removed' }; }

  async syncNow(id: string) {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('RSS feed not found');
    const items = await this.fetchFeedItems(feed.url);
    let imported = 0;
    for (const item of items) {
      const exists = await this.repository.isItemImported(id, item.guid || item.link);
      if (!exists) {
        await this.repository.createImportedItem(id, { guid: item.guid || item.link, title: item.title, url: item.link, imported_at: item.pubDate ? new Date(item.pubDate) : new Date() });
        imported++;
      }
    }
    await this.repository.update(id, { lastSyncedAt: new Date() });
    return { imported, total: items.length };
  }

  async listItems(feedId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [items, total] = await this.repository.findItems(feedId, offset, limit);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async fetchFeedMeta(url: string): Promise<{ title: string }> {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/);
      return { title: titleMatch ? titleMatch[1] : '' };
    } catch {
      return { title: '' };
    }
  }

  private async fetchFeedItems(url: string): Promise<{ title: string; link: string; guid: string; pubDate: string }[]> {
    const response = await axios.get(url, { timeout: 10000 });
    const xml = response.data;
    const items: { title: string; link: string; guid: string; pubDate: string }[] = [];
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];
    for (const item of itemMatches) {
      const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || '';
      const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || '';
      const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || '';
      const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || '';
      items.push({ title: title.trim(), link: link.trim(), guid: guid.trim() || link.trim(), pubDate: pubDate.trim() });
    }
    return items;
  }
}
