import { Injectable, NotFoundException } from '@nestjs/common';
import { TemplatesRepository } from './templates.repository';

@Injectable()
export class TemplatesService {
  constructor(private readonly repository: TemplatesRepository) {}

  async list(workspaceId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [templates, total] = await this.repository.findByWorkspace(workspaceId, offset, limit);
    return { data: templates, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: string, data: Record<string, unknown>) {
    return this.repository.create({ ...data });
  }

  async getById(id: string) {
    const template = await this.repository.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.repository.delete(id);
    return { message: 'Template deleted' };
  }

  async createPostFromTemplate(templateId: string, userId: string, scheduledAt?: string) {
    const template = await this.repository.findById(templateId);
    if (!template) throw new NotFoundException('Template not found');

    return this.repository.createPost({
      workspace_id: template.workspace_id,
      user_id: userId,
      caption: template.caption,
      platforms: template.platforms,
      content_type: template.content_type,
      platform_options: template.metadata,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
    });
  }
}
