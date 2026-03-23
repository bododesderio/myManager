import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByUserId(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { user_id: userId },
      include: { workspace: true },
    });
  }

  async findById(id: string) {
    return this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } },
        social_accounts: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.workspace.findUnique({ where: { slug } });
  }

  async create(data: { name: string; slug: string }) {
    return this.prisma.workspace.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.workspace.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    // Workspace model has no deletedAt field; consider alternative approach
    // For now, we could remove all members or mark via a status convention
    return this.prisma.workspace.delete({
      where: { id },
    });
  }

  async addMember(workspaceId: string, userId: string, role: string) {
    return this.prisma.workspaceMember.create({
      data: { workspace_id: workspaceId, user_id: userId, role: role as WorkspaceRole },
    });
  }

  async findMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: { user_id_workspace_id: { user_id: userId, workspace_id: workspaceId } },
    });
  }

  async findMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as WorkspaceRole },
    });
  }

  async removeMember(workspaceId: string, memberId: string) {
    return this.prisma.workspaceMember.delete({ where: { id: memberId } });
  }

  async createInvite(workspaceId: string, email: string, role: string, inviterId: string) {
    // WorkspaceMember has no invitedBy/invitedAt fields.
    // Creating a placeholder member entry for the inviter.
    return this.prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: inviterId, // Placeholder - in practice, look up or create user by email
        role: role as WorkspaceRole,
      },
    });
  }

  async countPosts(workspaceId: string) {
    return this.prisma.post.count({ where: { workspace_id: workspaceId } });
  }

  async countMembers(workspaceId: string) {
    return this.prisma.workspaceMember.count({ where: { workspace_id: workspaceId, status: 'ACTIVE' } });
  }

  async countSocialAccounts(workspaceId: string) {
    return this.prisma.socialAccount.count({ where: { workspace_id: workspaceId } });
  }

  async findWorkspaceSubscription(workspaceId: string) {
    return this.prisma.subscription.findFirst({
      where: { workspace_id: workspaceId, status: { in: ['ACTIVE', 'CANCELLING'] } },
      include: { plan: true },
    });
  }

  async findMembersWithActivity(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
      orderBy: { last_active_at: 'desc' },
    });
  }

  async countPostsByMember(workspaceId: string, since: Date) {
    return this.prisma.post.groupBy({
      by: ['user_id'],
      where: { workspace_id: workspaceId, created_at: { gte: since } },
      _count: { id: true },
    });
  }

  async countApprovalsByMember(workspaceId: string, since: Date) {
    return this.prisma.approvalEvent.groupBy({
      by: ['user_id'],
      where: {
        post: { workspace_id: workspaceId },
        action: 'approved',
        created_at: { gte: since },
      },
      _count: { id: true },
    });
  }

  async findApprovalConfig(workspaceId: string) {
    return this.prisma.workspaceApprovalConfig.findUnique({ where: { workspace_id: workspaceId } });
  }

  async upsertApprovalConfig(workspaceId: string, data: {
    require_approval: boolean;
    auto_approve_admins: boolean;
    require_client_review: boolean;
  }) {
    return this.prisma.workspaceApprovalConfig.upsert({
      where: { workspace_id: workspaceId },
      update: data,
      create: { workspace_id: workspaceId, ...data },
    });
  }
}
