import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.apiKey.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  async findById(id: string) { return this.prisma.apiKey.findUnique({ where: { id } }); }

  async findByPrefix(prefix: string) {
    return this.prisma.apiKey.findMany({ where: { key_prefix: prefix, is_active: true } });
  }

  async create(data: Record<string, unknown>) { return this.prisma.apiKey.create({ data } as unknown as Parameters<typeof this.prisma.apiKey.create>[0]); }
  async update(id: string, data: Record<string, unknown>) { return this.prisma.apiKey.update({ where: { id }, data }); }

  async updateLastUsed(id: string) {
    return this.prisma.apiKey.update({ where: { id }, data: { last_used_at: new Date() } });
  }
}
