import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.apiKey.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.
  async findById(id: string, workspaceId: string) {
    return this.prisma.apiKey.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  async findByPrefix(prefix: string) {
    return this.prisma.apiKey.findMany({ where: { key_prefix: prefix, is_active: true } });
  }

  async create(data: Record<string, unknown>) { return this.prisma.apiKey.create({ data } as unknown as Parameters<typeof this.prisma.apiKey.create>[0]); }
  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.apiKey.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  async updateLastUsed(id: string) {
    return this.prisma.apiKey.update({ where: { id }, data: { last_used_at: new Date() } });
  }
}
