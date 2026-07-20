import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { workspace_id: workspaceId };
    const [templates, total] = await Promise.all([
      this.prisma.postTemplate.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.postTemplate.count({ where }),
    ]);
    return [templates, total];
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority. A guard with a
  // hand-maintained route list rots the moment someone adds a module.

  async findById(id: string, workspaceId: string) {
    return this.prisma.postTemplate.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  async create(data: Record<string, unknown>) { return this.prisma.postTemplate.create({ data } as unknown as Parameters<typeof this.prisma.postTemplate.create>[0]); }

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.postTemplate.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.postTemplate.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

  async createPost(data: Record<string, unknown>) { return this.prisma.post.create({ data } as unknown as Parameters<typeof this.prisma.post.create>[0]); }
}
