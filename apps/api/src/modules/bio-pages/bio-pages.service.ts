import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BioPagesRepository } from './bio-pages.repository';

@Injectable()
export class BioPagesService {
  constructor(private readonly repository: BioPagesRepository) {}

  async listByWorkspace(workspaceId: string) {
    return this.repository.findByWorkspace(workspaceId);
  }

  async create(userId: string, data: Record<string, unknown>) {
    const existing = await this.repository.findBySlug(data.slug as string);
    if (existing) throw new ConflictException('Slug already taken');
    return this.repository.create({ ...data, createdBy: userId });
  }

  async getBySlug(slug: string) {
    const page = await this.repository.findBySlug(slug);
    if (!page) throw new NotFoundException('Bio page not found');
    await this.repository.incrementViews(page.id);
    return page;
  }

  async getById(id: string, workspaceId: string) {
    const page = await this.repository.findById(id, workspaceId);
    if (!page) throw new NotFoundException('Bio page not found');
    return page;
  }

  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const updated = await this.repository.update(id, workspaceId, data);
    // Indistinguishable from "not found" on purpose — a cross-workspace id must
    // not be confirmed as existing.
    if (!updated) throw new NotFoundException('Bio page not found');
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.repository.delete(id, workspaceId);
    if (!deleted) throw new NotFoundException('Bio page not found');
    return { message: 'Bio page deleted' };
  }

  async trackClick(slug: string, linkIndex: number, referrer?: string) {
    const page = await this.repository.findBySlug(slug);
    if (!page) throw new NotFoundException('Bio page not found');
    await this.repository.recordClick(page.id, linkIndex, referrer);
    return { tracked: true };
  }

  async getAnalytics(id: string, days: number) {
    return this.repository.getClickAnalytics(id, days);
  }
}
