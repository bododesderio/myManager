import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createInvitation(workspaceId: string, invitedById: string, email: string, role: string) {
    // Check seat limits
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const activeMembers = await this.prisma.workspaceMember.count({
      where: { workspace_id: workspaceId },
    });

    const subscription = await this.prisma.subscription.findFirst({
      where: { workspace_id: workspaceId, status: 'ACTIVE' },
      include: { plan: true },
    });

    const seatLimit = ((subscription?.locked_limits as Record<string, any> | null)?.seats ?? 1) as number;
    if (activeMembers >= seatLimit) {
      throw new UnprocessableEntityException({
        code: 'seat_quota_exceeded',
        currentSeats: activeMembers,
        planLimit: seatLimit,
        message: 'Seat quota exceeded. Upgrade your plan to add more members.',
      });
    }

    // Check no existing active member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspace_id: workspaceId,
        user: { email },
      },
    });
    if (existingMember) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Check no pending invitation
    const existingInvitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspace_id: workspaceId,
        email,
        accepted_at: null,
        cancelled_at: null,
        expires_at: { gt: new Date() },
      },
    });
    if (existingInvitation) {
      throw new BadRequestException('A pending invitation already exists for this email');
    }

    // Generate HMAC token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const tokenData = `${workspaceId}:${email}:${role}:${expiresAt.toISOString()}`;
    const token = crypto.createHmac('sha256', secret).update(tokenData).digest('hex');

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspace_id: workspaceId,
        email,
        role: role.toUpperCase() as WorkspaceRole,
        token,
        invited_by_id: invitedById,
        expires_at: expiresAt,
      },
    });

    // Enqueue invitation email
    await this.prisma.notification.create({
      data: {
        user_id: invitedById,
        type: 'email',
        title: 'team-invite',
        body: JSON.stringify({
          to: email,
          workspaceId,
          role,
          token,
          acceptUrl: `${this.configService.get('WEB_URL', 'http://localhost:3000')}/accept-invite?token=${token}&workspace=${workspaceId}`,
        }),
        read: false,
      },
    });

    return { invitation };
  }

  async listInvitations(workspaceId: string) {
    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspace_id: workspaceId,
        accepted_at: null,
        cancelled_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async cancelInvitation(workspaceId: string, id: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id, workspace_id: workspaceId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    return this.prisma.workspaceInvitation.update({
      where: { id },
      data: { cancelled_at: new Date() },
    });
  }

  async acceptInvitation(token: string, workspaceId: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        token,
        workspace_id: workspaceId,
        accepted_at: null,
        cancelled_at: null,
      },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation');
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      return {
        requiresSignup: true,
        email: invitation.email,
        workspaceId,
        role: invitation.role,
      };
    }

    // Add to workspace
    await this.prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: user.id,
        role: invitation.role,
      },
    });

    // Mark accepted
    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { accepted_at: new Date() },
    });

    return { workspaceId, role: invitation.role };
  }
}
