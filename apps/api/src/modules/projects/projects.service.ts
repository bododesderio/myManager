import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async listByWorkspace(workspaceId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [projects, total] = await this.repository.findByWorkspace(workspaceId, offset, limit);
    return {
      data: projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: string, data: {
    workspaceId: string;
    name: string;
    clientName?: string;
    clientEmail?: string;
    description?: string;
  }) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const project = await this.repository.create({
      workspace_id: data.workspaceId,
      name: data.name,
      slug,
      client_name: data.clientName,
      client_email: data.clientEmail,
      description: data.description,
    });
    await this.repository.addMember(project.id, userId, 'OWNER');
    return project;
  }

  async getById(id: string) {
    const project = await this.repository.findById(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.repository.softDelete(id);
    return { message: 'Project deleted' };
  }

  async listMembers(projectId: string) {
    return this.repository.findMembers(projectId);
  }

  async addMember(projectId: string, userId: string, role: string) {
    return this.repository.addMember(projectId, userId, role);
  }

  async removeMember(projectId: string, userId: string) {
    await this.repository.removeMember(projectId, userId);
    return { message: 'Member removed from project' };
  }

  async generatePortalToken(projectId: string, label: string = 'default') {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.repository.createPortalToken(projectId, token, expiresAt, label);
    return { token, expiresAt };
  }

  async getAnalytics(projectId: string, startDate: string, endDate: string) {
    return this.repository.getProjectAnalytics(
      projectId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
