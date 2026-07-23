import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { WorkspacesRepository } from './workspaces.repository';

// Assignable via invite / role-change. OWNER is deliberately excluded — the
// only WorkspaceRole values Prisma accepts are OWNER/ADMIN/MEMBER, and OWNER
// transfer is not exposed here. Normalizing (case-insensitive) turns a stray
// value into a clean 400 instead of a Prisma enum 500.
const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER'];

function normalizeAssignableRole(role: string): string {
  const normalized = (role || '').toUpperCase();
  if (!ASSIGNABLE_ROLES.includes(normalized)) {
    throw new BadRequestException(
      `Invalid role "${role}". Must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`,
    );
  }
  return normalized;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly repository: WorkspacesRepository) {}

  async listForUser(userId: string) {
    // Return the WORKSPACES the user belongs to (with their role), not the raw
    // membership rows. The client keys its active workspace off each item's `id`
    // and passes that as `workspaceId` on every scoped request — returning
    // membership rows (whose `id` is the membership id, not the workspace id)
    // made every downstream call 403 with the wrong workspace.
    const memberships = await this.repository.findByUserId(userId);
    return memberships.map((m) => ({ ...m.workspace, role: m.role }));
  }

  /** Superadmin listing of all workspaces for /admin/workspaces. */
  async listAllForAdmin(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [rows, total] = await this.repository.findAllForAdmin(offset, limit);
    const data = (rows as any[]).map((ws) => ({
      id: ws.id,
      name: ws.name,
      ownerEmail: ws.owner?.email ?? '—',
      plan: ws.subscriptions?.[0]?.plan?.name ?? 'Free',
      memberCount: ws._count?.members ?? 0,
      postCount: ws._count?.posts ?? 0,
      createdAt: ws.created_at,
    }));
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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

  // Defense in depth: these methods are also covered by @WorkspaceRoles at the
  // controller, but a member roster and role mutations are too sensitive to rely
  // on a single guard registration. This service must be safe to call directly.
  async listMembers(workspaceId: string, userId: string) {
    // Any active member may read the roster (the web derives the current user's
    // role and seat usage from it on every dashboard load). Mutations elsewhere
    // still require ensureAdminAccess / ensureOwnerAccess.
    await this.ensureMemberAccess(workspaceId, userId);
    return this.repository.findMembers(workspaceId);
  }

  async inviteMember(workspaceId: string, inviterId: string, email: string, role: string) {
    await this.ensureAdminAccess(workspaceId, inviterId);
    const normalizedRole = normalizeAssignableRole(role);
    const invite = await this.repository.createInvite(workspaceId, email, normalizedRole, inviterId);
    return invite;
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: string, actorId: string) {
    await this.ensureOwnerAccess(workspaceId, actorId);
    const normalizedRole = normalizeAssignableRole(role);
    return this.repository.updateMemberRole(workspaceId, memberId, normalizedRole);
  }

  async removeMember(workspaceId: string, memberId: string, actorId: string) {
    await this.ensureAdminAccess(workspaceId, actorId);
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
  }, userId: string) {
    // Disabling approval requirements bypasses the entire content review
    // pipeline — restricted to admins.
    await this.ensureAdminAccess(workspaceId, userId);
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

  private async ensureMemberAccess(workspaceId: string, userId: string) {
    const member = await this.repository.findMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
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
