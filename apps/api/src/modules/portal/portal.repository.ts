import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PortalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveToken(token: string) {
    return this.prisma.portalAccessToken.findFirst({
      where: {
        token,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
        revoked_at: null,
      },
      include: { project: { include: { workspace: true, brand_config: true } } },
    });
  }

  async findProjectPosts(projectId: string) {
    return this.prisma.post.findMany({
      where: { project_id: projectId },
      orderBy: [{ scheduled_at: 'asc' }, { created_at: 'desc' }],
      include: {
        analytics: true,
        approval_events: {
          orderBy: { created_at: 'desc' },
          take: 3,
        },
      },
    });
  }

  async findProjectReports(projectId: string) {
    return this.prisma.report.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
  }

  async findPostForPortal(postId: string, projectId: string) {
    return this.prisma.post.findFirst({
      where: { id: postId, project_id: projectId },
      include: {
        media: { include: { media_asset: true } },
        user: { select: { id: true, name: true, avatar_url: true } },
      },
    });
  }

  async updatePostStatus(postId: string, status: PostStatus) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { status },
    });
  }

  async createApprovalEvent(postId: string, userId: string | null, action: string, comment: string | null) {
    return this.prisma.approvalEvent.create({
      data: {
        post_id: postId,
        user_id: userId ?? 'portal-client',
        action,
        comment,
      },
    });
  }

  async createPortalAction(portalTokenId: string, projectId: string, action: string, metadata: Record<string, any>) {
    return this.prisma.portalAction.create({
      data: {
        portal_token_id: portalTokenId,
        project_id: projectId,
        action,
        metadata,
      },
    });
  }

  async createPortalAuditLog(portalTokenId: string, action: string, postId: string | null, comment: string | null, ipAddress: string | null) {
    return this.prisma.portalAuditLog.create({
      data: {
        portal_token_id: portalTokenId,
        action,
        post_id: postId,
        comment,
        ip_address: ipAddress,
      },
    });
  }
}
