import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { workspace_id: workspaceId },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { members: { include: { user: { select: { id: true, name: true, avatar_url: true } } } } },
      }),
      this.prisma.project.count({ where: { workspace_id: workspaceId } }),
    ]);
    return [projects, total];
  }

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } },
        brand_config: true,
      },
    });
  }

  async create(data: {
    workspace_id: string;
    name: string;
    slug: string;
    client_name?: string;
    client_email?: string;
    description?: string;
  }) {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    // Project model has no deletedAt field; update status instead
    return this.prisma.project.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async findMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
  }

  async addMember(projectId: string, userId: string, role: string) {
    return this.prisma.projectMember.create({
      data: { project_id: projectId, user_id: userId, role },
    });
  }

  async removeMember(projectId: string, userId: string) {
    return this.prisma.projectMember.deleteMany({
      where: { project_id: projectId, user_id: userId },
    });
  }

  async createPortalToken(projectId: string, token: string, expiresAt: Date, label: string) {
    return this.prisma.portalAccessToken.create({
      data: { project_id: projectId, token, expires_at: expiresAt, label },
    });
  }

  async getProjectAnalytics(projectId: string, startDate: Date, endDate: Date) {
    const posts = await this.prisma.post.findMany({
      where: { project_id: projectId, created_at: { gte: startDate, lte: endDate } },
      include: { analytics: true },
    });

    const totals = {
      totalPosts: posts.length,
      totalReach: 0,
      totalImpressions: 0,
      totalEngagements: 0,
      totalClicks: 0,
    };

    for (const post of posts) {
      for (const analytic of post.analytics) {
        totals.totalReach += analytic.reach || 0;
        totals.totalImpressions += analytic.impressions || 0;
        totals.totalEngagements += (analytic.likes + analytic.comments + analytic.shares) || 0;
        totals.totalClicks += analytic.clicks || 0;
      }
    }

    return totals;
  }
}
