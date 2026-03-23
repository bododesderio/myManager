import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    @InjectQueue('report-generation') private reportQueue: Queue,
  ) {}

  async list(workspaceId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [reports, total] = await this.repository.findByWorkspace(workspaceId, offset, limit);
    return { data: reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async generate(userId: string, data: {
    workspaceId: string; projectId?: string; type: string; fileFormat: string;
    dateRange: { start: string; end: string }; platforms?: string[];
  }) {
    const report = await this.repository.create({
      workspace_id: data.workspaceId,
      project_id: data.projectId,
      type: data.type,
      title: `${data.type} report`,
      file_format: data.fileFormat,
      date_from: new Date(data.dateRange.start),
      date_to: new Date(data.dateRange.end),
      platforms: data.platforms || [],
      status: 'QUEUED',
    });

    await this.reportQueue.add('generate', { reportId: report.id }, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 30000 },
    });

    return { message: 'Report generation queued', reportId: report.id };
  }

  async getById(id: string) {
    const report = await this.repository.findById(id);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async delete(id: string) {
    await this.repository.delete(id);
    return { message: 'Report deleted' };
  }

  async listConfigs(workspaceId: string) {
    return this.repository.findConfigs(workspaceId);
  }

  async saveConfig(data: Record<string, unknown>) {
    return this.repository.createConfig(data);
  }

  async updateConfig(id: string, data: Record<string, unknown>) {
    return this.repository.updateConfig(id, data);
  }

  async deleteConfig(id: string) {
    await this.repository.deleteConfig(id);
    return { message: 'Report configuration deleted' };
  }
}
