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

  async getById(id: string) {
    const page = await this.repository.findById(id);
    if (!page) throw new NotFoundException('Bio page not found');
    return page;
  }

  async update(id: string, data: Record<string, unknown>) { return this.repository.update(id, data); }

  async delete(id: string) { await this.repository.delete(id); return { message: 'Bio page deleted' }; }

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
