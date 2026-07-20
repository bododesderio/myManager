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

  async getById(id: string, workspaceId: string) {
    const project = await this.repository.findById(id, workspaceId);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  /**
   * projectMember and portalAccessToken have no workspace_id of their own, so
   * they cannot self-scope. Every method that writes to them must first prove
   * the parent project belongs to the caller's workspace — that is what this
   * does, and why it is called before each of them.
   */
  private async ensureProjectInWorkspace(projectId: string, workspaceId: string) {
    const project = await this.repository.findById(projectId, workspaceId);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const updated = await this.repository.update(id, workspaceId, data);
    // Indistinguishable from "not found" on purpose.
    if (!updated) throw new NotFoundException('Project not found');
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const deleted = await this.repository.softDelete(id, workspaceId);
    if (!deleted) throw new NotFoundException('Project not found');
    return { message: 'Project deleted' };
  }

  async listMembers(projectId: string, workspaceId: string) {
    return this.repository.findMembers(projectId, workspaceId);
  }

  async addMember(projectId: string, workspaceId: string, userId: string, role: string) {
    await this.ensureProjectInWorkspace(projectId, workspaceId);
    return this.repository.addMember(projectId, userId, role);
  }

  async removeMember(projectId: string, workspaceId: string, userId: string) {
    await this.ensureProjectInWorkspace(projectId, workspaceId);
    await this.repository.removeMember(projectId, userId);
    return { message: 'Member removed from project' };
  }

  async generatePortalToken(projectId: string, workspaceId: string, label: string = 'default') {
    // Highest-risk of the three: a portal token grants an OUTSIDE party read
    // access to the project's content. Issuing one against another tenant's
    // project would hand over their client portal.
    await this.ensureProjectInWorkspace(projectId, workspaceId);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.repository.createPortalToken(projectId, token, expiresAt, label);
    return { token, expiresAt };
  }

  async getAnalytics(projectId: string, workspaceId: string, startDate: string, endDate: string) {
    return this.repository.getProjectAnalytics(
      projectId,
      workspaceId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
