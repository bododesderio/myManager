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

  async findById(id: string) { return this.prisma.postTemplate.findUnique({ where: { id } }); }

  async create(data: Record<string, unknown>) { return this.prisma.postTemplate.create({ data } as unknown as Parameters<typeof this.prisma.postTemplate.create>[0]); }

  async update(id: string, data: Record<string, unknown>) { return this.prisma.postTemplate.update({ where: { id }, data }); }

  async delete(id: string) { return this.prisma.postTemplate.delete({ where: { id } }); }

  async createPost(data: Record<string, unknown>) { return this.prisma.post.create({ data } as unknown as Parameters<typeof this.prisma.post.create>[0]); }
}
