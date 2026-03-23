import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PortalRepository } from './portal.repository';

const VALID_CLIENT_TRANSITIONS: Record<string, PostStatus[]> = {
  PENDING_CLIENT_APPROVAL: ['APPROVED_BY_CLIENT' as PostStatus, 'REVISION_REQUESTED' as PostStatus],
};

@Injectable()
export class PortalService {
  constructor(private readonly repository: PortalRepository) {}

  async getPortalData(token: string) {
    const portalToken = await this.repository.findActiveToken(token);
    if (!portalToken) {
      throw new ForbiddenException('Invalid or expired portal token');
    }

    const [posts, reports] = await Promise.all([
      this.repository.findProjectPosts(portalToken.project_id),
      this.repository.findProjectReports(portalToken.project_id),
    ]);

    const publishedPosts = posts.filter((post) => post.status === 'PUBLISHED');
    const approvals = posts.filter((post) =>
      ['PENDING_CLIENT_APPROVAL', 'REVISION_REQUESTED'].includes(post.status),
    );
    const scheduled = posts.filter((post) =>
      ['SCHEDULED', 'APPROVED_BY_CLIENT', 'PENDING_CLIENT_APPROVAL', 'REVISION_REQUESTED'].includes(post.status),
    );

    const allAnalytics = publishedPosts.flatMap((post) => post.analytics);
    const totalReach = allAnalytics.reduce((sum, item) => sum + item.reach, 0);
    const totalImpressions = allAnalytics.reduce((sum, item) => sum + item.impressions, 0);
    const totalEngagements = allAnalytics.reduce(
      (sum, item) => sum + item.likes + item.comments + item.shares + item.saves,
      0,
    );
    const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    const platformMap = new Map<string, number>();
    for (const item of allAnalytics) {
      platformMap.set(item.platform, (platformMap.get(item.platform) ?? 0) + item.reach);
    }

    const now = new Date();
    const weeklyReach = Array.from({ length: 4 }, (_, offset) => {
      const end = new Date(now);
      end.setDate(now.getDate() - offset * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);

      return {
        week: `W${4 - offset}`,
        value: allAnalytics
          .filter((item) => item.synced_at >= start && item.synced_at <= end)
          .reduce((sum, item) => sum + item.reach, 0),
      };
    }).reverse();

    const topPosts = publishedPosts
      .map((post) => {
        const reach = post.analytics.reduce((sum, item) => sum + item.reach, 0);
        const impressions = post.analytics.reduce((sum, item) => sum + item.impressions, 0);
        const engagements = post.analytics.reduce(
          (sum, item) => sum + item.likes + item.comments + item.shares + item.saves,
          0,
        );

        return {
          id: post.id,
          caption: post.caption,
          platforms: post.platforms,
          reach,
          engagement_rate: impressions > 0 ? (engagements / impressions) * 100 : 0,
          published_at: post.published_at,
        };
      })
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5);

    return {
      project: {
        id: portalToken.project.id,
        name: portalToken.project.name,
        client_name: portalToken.client_name ?? portalToken.project.client_name ?? 'Client',
        client_email: portalToken.client_email ?? portalToken.project.client_email ?? null,
        agency_name: portalToken.project.workspace?.name ?? 'Agency',
        brand_config: portalToken.project.brand_config?.config ?? null,
      },
      token: {
        label: portalToken.label,
        expires_at: portalToken.expires_at,
      },
      metrics: {
        totalReach,
        totalImpressions,
        engagementRate: Math.round(engagementRate * 10) / 10,
        postsPublished: publishedPosts.length,
      },
      weeklyReach,
      platformBreakdown: Array.from(platformMap.entries())
        .map(([platform, reach]) => ({ platform, reach }))
        .sort((a, b) => b.reach - a.reach),
      topPosts,
      approvals: approvals.map((post) => ({
        id: post.id,
        caption: post.caption,
        platforms: post.platforms,
        scheduled_at: post.scheduled_at,
        status: post.status,
        latest_comment: post.approval_events[0]?.comment ?? null,
      })),
      scheduled: scheduled.slice(0, 12).map((post) => ({
        id: post.id,
        caption: post.caption,
        platforms: post.platforms,
        scheduled_at: post.scheduled_at,
        status: post.status,
      })),
      reports: reports.map((report) => ({
        id: report.id,
        title: report.title,
        status: report.status,
        file_url: report.file_url,
        file_format: report.file_format,
        generated_at: report.generated_at,
        created_at: report.created_at,
      })),
    };
  }

  async approvePost(
    token: string,
    postId: string,
    comment: string | undefined,
    ipAddress: string | null,
  ) {
    const portalToken = await this.repository.findActiveToken(token);
    if (!portalToken) {
      throw new ForbiddenException('Invalid or expired portal token');
    }

    const post = await this.repository.findPostForPortal(postId, portalToken.project_id);
    if (!post) {
      throw new NotFoundException('Post not found in this project');
    }

    this.validateTransition(post.status, 'APPROVED_BY_CLIENT' as PostStatus);

    await this.repository.updatePostStatus(postId, 'APPROVED_BY_CLIENT' as PostStatus);
    await this.repository.createApprovalEvent(postId, null, 'client_approved', comment ?? null);
    await this.repository.createPortalAction(portalToken.id, portalToken.project_id, 'approve', { postId, comment });
    await this.repository.createPortalAuditLog(portalToken.id, 'approve', postId, comment ?? null, ipAddress);

    return { message: 'Post approved by client', postId };
  }

  async revisePost(
    token: string,
    postId: string,
    comment: string,
    ipAddress: string | null,
  ) {
    if (!comment || comment.trim().length === 0) {
      throw new BadRequestException('A comment is required when requesting revisions');
    }

    const portalToken = await this.repository.findActiveToken(token);
    if (!portalToken) {
      throw new ForbiddenException('Invalid or expired portal token');
    }

    const post = await this.repository.findPostForPortal(postId, portalToken.project_id);
    if (!post) {
      throw new NotFoundException('Post not found in this project');
    }

    this.validateTransition(post.status, 'REVISION_REQUESTED' as PostStatus);

    await this.repository.updatePostStatus(postId, 'REVISION_REQUESTED' as PostStatus);
    await this.repository.createApprovalEvent(postId, null, 'client_revision_requested', comment);
    await this.repository.createPortalAction(portalToken.id, portalToken.project_id, 'revise', { postId, comment });
    await this.repository.createPortalAuditLog(portalToken.id, 'revise', postId, comment, ipAddress);

    return { message: 'Revision requested by client', postId };
  }

  private validateTransition(currentStatus: string, targetStatus: PostStatus) {
    const allowed = VALID_CLIENT_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${targetStatus}". Post must be in "PENDING_CLIENT_APPROVAL" status.`,
      );
    }
  }
}
