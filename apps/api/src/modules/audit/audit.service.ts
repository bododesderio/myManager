import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async log(action: string, data: {
    userId?: string; workspaceId?: string; resourceType?: string;
    resourceId?: string; metadata?: Record<string, unknown>; ipAddress?: string;
  }) {
    return this.repository.create({
      action,
      userId: data.userId,
      workspaceId: data.workspaceId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
    });
  }

  async list(workspaceId: string, filters: {
    action?: string; userId?: string; resourceType?: string;
    startDate?: string; endDate?: string;
  }, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [entries, total] = await this.repository.findByWorkspace(workspaceId, filters, offset, limit);
    return { data: entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async listActionTypes(workspaceId: string) {
    return this.repository.getDistinctActions(workspaceId);
  }

  async exportCsv(workspaceId: string, startDate: string, endDate: string) {
    const entries = await this.repository.findAllForExport(workspaceId, new Date(startDate), new Date(endDate));
    const header = 'timestamp,action,user_id,resource_type,resource_id,ip_address,metadata\n';
    const rows = entries.map((e: any) =>
      `${e.created_at.toISOString()},${e.action},${e.user_id || ''},${e.entity_type || ''},${e.entity_id || ''},${e.ip_address || ''},"${JSON.stringify(e.metadata || {}).replace(/"/g, '""')}"`
    ).join('\n');
    return { csv: header + rows, contentType: 'text/csv' };
  }
}
