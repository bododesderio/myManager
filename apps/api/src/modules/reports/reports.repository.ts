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

  async findById(id: string) {
    return this.prisma.report.findUnique({ where: { id } });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.report.create({ data: data as unknown as Parameters<typeof this.prisma.report.create>[0]['data'] });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.report.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.report.delete({ where: { id } });
  }

  async findConfigs(workspaceId: string) {
    return this.prisma.reportConfig.findMany({ where: { workspace_id: workspaceId }, orderBy: { created_at: 'desc' } });
  }

  async createConfig(data: Record<string, unknown>) {
    return this.prisma.reportConfig.create({ data: data as unknown as Parameters<typeof this.prisma.reportConfig.create>[0]['data'] });
  }

  async updateConfig(id: string, data: Record<string, unknown>) {
    return this.prisma.reportConfig.update({ where: { id }, data });
  }

  async deleteConfig(id: string) {
    return this.prisma.reportConfig.delete({ where: { id } });
  }
}
