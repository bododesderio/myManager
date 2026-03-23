import { Injectable } from '@nestjs/common';
import { ListeningRepository } from './listening.repository';

@Injectable()
export class ListeningService {
  constructor(private readonly repository: ListeningRepository) {}

  async listTerms(workspaceId: string) { return this.repository.findTerms(workspaceId); }

  async addTerm(data: { workspaceId: string; term: string; platforms: string[] }) {
    return this.repository.createTerm(data);
  }

  async removeTerm(id: string) { await this.repository.deleteTerm(id); return { message: 'Monitoring term removed' }; }

  async listMentions(workspaceId: string, platform: string | undefined, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [mentions, total] = await this.repository.findMentions(workspaceId, platform, offset, limit);
    return { data: mentions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAnalytics(workspaceId: string, startDate: string, endDate: string) {
    return this.repository.getMentionAnalytics(workspaceId, new Date(startDate), new Date(endDate));
  }

  async getTrending(workspaceId: string) { return this.repository.getTrendingTopics(workspaceId); }
}
