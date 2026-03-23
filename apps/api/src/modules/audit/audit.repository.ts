import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: Record<string, unknown>) {
    return this.prisma.auditLog.create({ data } as unknown as Parameters<typeof this.prisma.auditLog.create>[0]);
  }

  async findByWorkspace(workspaceId: string, filters: {
    action?: string; userId?: string; entityType?: string;
    startDate?: string; endDate?: string;
  }, offset: number, limit: number): Promise<[unknown[], number]> {
    const where: Record<string, any> = { workspace_id: workspaceId };
    if (filters.action) where.action = filters.action;
    if (filters.userId) where.user_id = filters.userId;
    if (filters.entityType) where.entity_type = filters.entityType;
    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = new Date(filters.startDate);
      if (filters.endDate) where.created_at.lte = new Date(filters.endDate);
    }

    const [entries, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip: offset, take: limit, orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return [entries, total];
  }

  async getDistinctActions(workspaceId: string) {
    const actions = await this.prisma.auditLog.findMany({
      where: { workspace_id: workspaceId },
      select: { action: true },
      distinct: ['action'],
    });
    return actions.map((a) => a.action);
  }

  async findAllForExport(workspaceId: string, startDate: Date, endDate: Date) {
    return this.prisma.auditLog.findMany({
      where: { workspace_id: workspaceId, created_at: { gte: startDate, lte: endDate } },
      orderBy: { created_at: 'asc' },
    });
  }
}
