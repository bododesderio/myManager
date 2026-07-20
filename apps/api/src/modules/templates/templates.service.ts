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

  async getById(id: string, workspaceId: string) {
    const template = await this.repository.findById(id, workspaceId);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const updated = await this.repository.update(id, workspaceId, data);
    // Indistinguishable from "not found" on purpose — a cross-workspace id must
    // not be confirmed as existing.
    if (!updated) throw new NotFoundException('Template not found');
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.repository.delete(id, workspaceId);
    if (!deleted) throw new NotFoundException('Template not found');
    return { message: 'Template deleted' };
  }

  async createPostFromTemplate(
    templateId: string,
    userId: string,
    workspaceId: string,
    scheduledAt?: string,
  ) {
    // Scoped lookup closes the escalation where a stolen template's
    // workspace_id was copied onto a new post, turning a cross-tenant read into
    // a cross-tenant write.
    const template = await this.repository.findById(templateId, workspaceId);
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
