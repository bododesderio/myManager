import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignsRepository } from './campaigns.repository';

@Injectable()
export class CampaignsService {
  constructor(private readonly repository: CampaignsRepository) {}

  async list(workspaceId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [campaigns, total] = await this.repository.findByWorkspace(workspaceId, offset, limit);
    return { data: campaigns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: string, data: Record<string, unknown>) {
    return this.repository.create({ ...data, createdBy: userId, startDate: new Date(data.startDate as string), endDate: new Date(data.endDate as string) });
  }

  async getById(id: string) {
    const campaign = await this.repository.findById(id);
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, data: Record<string, unknown>) { return this.repository.update(id, data); }

  async delete(id: string) { await this.repository.delete(id); return { message: 'Campaign deleted' }; }

  async addPosts(campaignId: string, postIds: string[]) {
    await this.repository.addPosts(campaignId, postIds);
    return { message: `${postIds.length} posts added to campaign` };
  }

  async removePost(campaignId: string, postId: string) {
    await this.repository.removePost(campaignId, postId);
    return { message: 'Post removed from campaign' };
  }

  async getAnalytics(id: string) { return this.repository.getAnalytics(id); }
}
