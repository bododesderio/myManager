import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { WorkspacesRepository } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  constructor(private readonly repository: WorkspacesRepository) {}

  async listForUser(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async create(userId: string, data: { name: string; slug?: string }) {
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.repository.findBySlug(slug);
    if (existing) throw new ConflictException('Workspace slug already taken');

    const workspace = await this.repository.create({ name: data.name, slug });
    await this.repository.addMember(workspace.id, userId, 'OWNER');
    return workspace;
  }

  async getById(id: string, userId: string) {
    const workspace = await this.repository.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await this.repository.findMember(id, userId);
    if (!member) throw new ForbiddenException('You are not a member of this workspace');

    return workspace;
  }

  async update(id: string, userId: string, data: { name?: string; slug?: string; avatarUrl?: string }) {
    await this.ensureAdminAccess(id, userId);
    return this.repository.update(id, data);
  }

  async delete(id: string, userId: string) {
    await this.ensureOwnerAccess(id, userId);
    await this.repository.softDelete(id);
    return { message: 'Workspace deleted' };
  }

  async listMembers(workspaceId: string) {
    return this.repository.findMembers(workspaceId);
  }

  async inviteMember(workspaceId: string, inviterId: string, email: string, role: string) {
    await this.ensureAdminAccess(workspaceId, inviterId);
    const invite = await this.repository.createInvite(workspaceId, email, role, inviterId);
    return invite;
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    return this.repository.updateMemberRole(workspaceId, memberId, role);
  }

  async removeMember(workspaceId: string, memberId: string) {
    await this.repository.removeMember(workspaceId, memberId);
    return { message: 'Member removed' };
  }

  async getApprovalConfig(workspaceId: string) {
    return this.repository.findApprovalConfig(workspaceId);
  }

  async updateApprovalConfig(workspaceId: string, data: {
    require_approval: boolean;
    auto_approve_admins: boolean;
    require_client_review: boolean;
  }) {
    return this.repository.upsertApprovalConfig(workspaceId, data);
  }

  async getUsage(workspaceId: string, userId: string) {
    const workspace = await this.repository.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await this.repository.findMember(workspaceId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this workspace');

    const [postCount, memberCount, socialAccountCount, subscription] = await Promise.all([
      this.repository.countPosts(workspaceId),
      this.repository.countMembers(workspaceId),
      this.repository.countSocialAccounts(workspaceId),
      this.repository.findWorkspaceSubscription(workspaceId),
    ]);

    const limits = (subscription?.locked_limits as Record<string, unknown>) ?? {
      posts_per_month: 10,
      social_accounts: 3,
      team_members: 1,
      media_storage_mb: 100,
    };

    return {
      usage: {
        posts: postCount,
        members: memberCount,
        socialAccounts: socialAccountCount,
      },
      limits,
      plan: subscription?.plan ?? { name: 'Free', slug: 'free' },
    };
  }

  async getTeamActivity(workspaceId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [members, recentPosts, recentApprovals] = await Promise.all([
      this.repository.findMembersWithActivity(workspaceId),
      this.repository.countPostsByMember(workspaceId, since),
      this.repository.countApprovalsByMember(workspaceId, since),
    ]);

    const activity = members.map((m: any) => ({
      memberId: m.id,
      userId: m.user_id,
      name: m.user?.name,
      email: m.user?.email,
      avatarUrl: m.user?.avatar_url,
      role: m.role,
      lastActiveAt: m.last_active_at,
      joinedAt: m.joined_at,
      postsCreated: recentPosts.find((p: any) => p.user_id === m.user_id)?._count?.id ?? 0,
      approvalsGiven: recentApprovals.find((a: any) => a.user_id === m.user_id)?._count?.id ?? 0,
    }));

    return { data: activity, period: { days, since: since.toISOString() } };
  }

  private async ensureAdminAccess(workspaceId: string, userId: string) {
    const member = await this.repository.findMember(workspaceId, userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  private async ensureOwnerAccess(workspaceId: string, userId: string) {
    const member = await this.repository.findMember(workspaceId, userId);
    if (!member || member.role !== 'OWNER') {
      throw new ForbiddenException('Owner access required');
    }
  }
}
