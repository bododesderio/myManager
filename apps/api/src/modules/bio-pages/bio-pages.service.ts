import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BioPagesRepository } from './bio-pages.repository';

/** Highest accepted link index — bounds anonymous writes to bio_link_events. */
const MAX_LINK_INDEX = 200;
/** Referrer is caller-supplied on a public endpoint; truncate rather than trust. */
const MAX_REFERRER_LENGTH = 512;

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

  /**
   * Anonymous read of a published bio page.
   *
   * Uses the published-only, field-restricted lookup: a draft must not be
   * readable by slug, and a visitor must not receive workspace_id or other
   * internal identifiers. NotFound covers both "no such slug" and "exists but
   * unpublished", so the endpoint cannot be used to enumerate taken slugs.
   */
  async getBySlug(slug: string) {
    const page = await this.repository.findPublishedBySlug(slug);
    if (!page) throw new NotFoundException('Bio page not found');
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

  /**
   * Anonymous click tracking. Only published pages accept events, so an
   * unpublished draft cannot have its analytics seeded by an outsider.
   */
  async trackClick(slug: string, linkIndex: number, referrer?: string) {
    const pageId = await this.repository.findPublishedIdBySlug(slug);
    if (!pageId) throw new NotFoundException('Bio page not found');

    if (!Number.isInteger(linkIndex) || linkIndex < 0 || linkIndex > MAX_LINK_INDEX) {
      throw new BadRequestException('Invalid link index');
    }

    // Referrer is attacker-controlled on a public endpoint — bound it so it
    // cannot be used to write arbitrarily large rows.
    const safeReferrer = typeof referrer === 'string'
      ? referrer.slice(0, MAX_REFERRER_LENGTH)
      : undefined;

    await this.repository.recordClick(pageId, linkIndex, safeReferrer);
    return { tracked: true };
  }

  async getAnalytics(id: string, workspaceId: string, days: number) {
    return this.repository.getClickAnalytics(id, workspaceId, days);
  }
}
