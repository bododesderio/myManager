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

  async getById(id: string, workspaceId: string) {
    const report = await this.repository.findById(id, workspaceId);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.repository.delete(id, workspaceId);
    // Indistinguishable from "not found" on purpose — a cross-workspace id must
    // not be confirmed as existing.
    if (!deleted) throw new NotFoundException('Report not found');
    return { message: 'Report deleted' };
  }

  async listConfigs(workspaceId: string) {
    return this.repository.findConfigs(workspaceId);
  }

  async saveConfig(data: Record<string, unknown>) {
    return this.repository.createConfig(data);
  }

  async updateConfig(id: string, workspaceId: string, data: Record<string, unknown>) {
    const updated = await this.repository.updateConfig(id, workspaceId, data);
    // Indistinguishable from "not found" on purpose.
    if (!updated) throw new NotFoundException('Report configuration not found');
    return updated;
  }

  async deleteConfig(id: string, workspaceId: string) {
    const deleted = await this.repository.deleteConfig(id, workspaceId);
    if (!deleted) throw new NotFoundException('Report configuration not found');
    return { message: 'Report configuration deleted' };
  }
}
