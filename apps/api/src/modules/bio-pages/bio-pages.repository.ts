import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BioPagesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.bioPage.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.

  async findById(id: string, workspaceId: string) {
    return this.prisma.bioPage.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.bioPage.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.bioPage.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

  /** Authenticated lookup — returns the full record regardless of publish state. */
  async findBySlug(slug: string) { return this.prisma.bioPage.findUnique({ where: { slug } }); }

  /**
   * Anonymous lookup for the public link-in-bio page.
   *
   * Two constraints the authenticated path does not have:
   *  - `is_published: true` — an unpublished page is a draft and must not be
   *    readable by slug. Without this, adding @Public() would have exposed every
   *    draft in every workspace to anyone who guessed a slug.
   *  - an explicit `select` — a public visitor has no business seeing
   *    workspace_id, project_id, custom_domain or timestamps. Returning the whole
   *    row would leak the tenant identifier of every page owner.
   */
  async findPublishedBySlug(slug: string) {
    return this.prisma.bioPage.findFirst({
      where: { slug, is_published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        bio: true,
        avatar_url: true,
        theme: true,
        links: true,
      },
    });
  }

  async create(data: Record<string, unknown>) { return this.prisma.bioPage.create({ data } as unknown as Parameters<typeof this.prisma.bioPage.create>[0]); }

  /**
   * NOTE: view counting was never implemented. This previously issued
   * `update({ where: { id }, data: {} })` — an empty UPDATE that incremented
   * nothing, because BioPage has no view-count column. On a public endpoint that
   * is a write on every anonymous request for no benefit: pure amplification.
   *
   * Removed rather than "fixed", because adding a counter is a product decision
   * (needs a schema column, and a naive per-request UPDATE would serialise on the
   * row under load — a counter wants batching or a separate events table, which
   * bio_link_events already provides for clicks).
   */
  async findPublishedIdBySlug(slug: string) {
    const page = await this.prisma.bioPage.findFirst({
      where: { slug, is_published: true },
      select: { id: true },
    });
    return page?.id ?? null;
  }

  async recordClick(bioPageId: string, linkIndex: number, referrer?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.bioLinkEvent.create({
      data: { bio_page_id: bioPageId, link_index: linkIndex, referrer, date: today },
    });
  }

  /**
   * Scoped by workspace via the parent bio page — this was reachable with a bare
   * id, so click analytics for another tenant's page were readable by anyone who
   * knew the UUID. Missed in the Phase 2 tenancy sweep because it queries
   * bio_link_events rather than bio_pages.
   */
  async getClickAnalytics(bioPageId: string, workspaceId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.prisma.bioLinkEvent.groupBy({
      by: ['link_index', 'date'],
      where: {
        bio_page_id: bioPageId,
        bio_page: { workspace_id: workspaceId },
        date: { gte: since },
      },
      _count: { id: true },
      orderBy: { date: 'asc' },
    });
  }
}
