import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { workspace_id: workspaceId };
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.report.count({ where }),
    ]);
    return [reports, total];
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.
  async findById(id: string, workspaceId: string) {
    return this.prisma.report.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.report.create({ data: data as unknown as Parameters<typeof this.prisma.report.create>[0]['data'] });
  }

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.report.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.report.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

  async findConfigs(workspaceId: string) {
    return this.prisma.reportConfig.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  async createConfig(data: Record<string, unknown>) {
    return this.prisma.reportConfig.create({ data: data as unknown as Parameters<typeof this.prisma.reportConfig.create>[0]['data'] });
  }

  /** Returns null when the config does not exist *or* belongs to another workspace. */
  async updateConfig(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.reportConfig.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.prisma.reportConfig.findFirst({ where: { id, workspace_id: workspaceId } });
  }

  /** Returns false when the config does not exist *or* belongs to another workspace. */
  async deleteConfig(id: string, workspaceId: string) {
    const result = await this.prisma.reportConfig.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }
}
