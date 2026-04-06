import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;
    if (user.is_superadmin) return true;

    const workspaceId = await this.resolveWorkspaceId(request);
    if (!workspaceId) return true;

    const member = await this.prisma.workspaceMember.findFirst({
      where: { user_id: user.id, workspace_id: workspaceId, status: { not: 'REMOVED' } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    request.workspaceId = workspaceId;
    request.workspaceMember = member;
    return true;
  }

  private async resolveWorkspaceId(request: {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    baseUrl?: string;
    path?: string;
    route?: { path?: string };
  }): Promise<string | null> {
    const explicitWorkspaceId = this.getString(
      request.params?.workspaceId ??
      request.query?.workspaceId ??
      request.body?.workspaceId,
    );

    if (explicitWorkspaceId) {
      return explicitWorkspaceId;
    }

    return this.inferWorkspaceIdFromResource(request);
  }

  private async inferWorkspaceIdFromResource(request: {
    params?: Record<string, unknown>;
    body?: Record<string, unknown>;
    baseUrl?: string;
    path?: string;
    route?: { path?: string };
  }): Promise<string | null> {
    const routePath = `${request.baseUrl ?? ''}${request.route?.path ?? request.path ?? ''}`.toLowerCase();

    if (routePath.includes('/posts')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findPostWorkspaceId(id);

      const postIds = this.getStringArray(request.body?.postIds);
      if (postIds.length > 0) {
        return this.resolveSharedWorkspace(postIds, (postId) => this.findPostWorkspaceId(postId));
      }
    }

    if (routePath.includes('/media')) {
      const id = this.getString(request.params?.id) ?? this.getString(request.body?.mediaId);
      if (id) return this.findMediaWorkspaceId(id);

      const mediaIds = this.getStringArray(request.body?.mediaIds);
      if (mediaIds.length > 0) {
        return this.resolveSharedWorkspace(mediaIds, (mediaId) => this.findMediaWorkspaceId(mediaId));
      }
    }

    if (routePath.includes('/projects')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findProjectWorkspaceId(id);
    }

    if (routePath.includes('/reports/configs')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findReportConfigWorkspaceId(id);
    }

    if (routePath.includes('/reports')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findReportWorkspaceId(id);
    }

    if (routePath.includes('/social-accounts')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findSocialAccountWorkspaceId(id);
    }

    if (routePath.includes('/api-keys')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findApiKeyWorkspaceId(id);
    }

    if (routePath.includes('/webhooks/deliveries')) {
      const deliveryId = this.getString(request.params?.deliveryId);
      if (deliveryId) return this.findWebhookDeliveryWorkspaceId(deliveryId);
    }

    if (routePath.includes('/webhooks')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findWebhookWorkspaceId(id);
    }

    if (routePath.includes('/comments')) {
      const id = this.getString(request.params?.id);
      if (!id) return null;

      if (routePath.endsWith('/:id/status')) {
        return this.findCommentAssignmentWorkspaceId(id);
      }

      return this.findCommentWorkspaceId(id);
    }

    return null;
  }

  private async resolveSharedWorkspace(
    ids: string[],
    resolver: (id: string) => Promise<string | null>,
  ): Promise<string | null> {
    let workspaceId: string | null = null;

    for (const id of ids) {
      const currentWorkspaceId = await resolver(id);
      if (!currentWorkspaceId) {
        return null;
      }

      if (!workspaceId) {
        workspaceId = currentWorkspaceId;
        continue;
      }

      if (workspaceId !== currentWorkspaceId) {
        throw new ForbiddenException('Resource selection spans multiple workspaces');
      }
    }

    return workspaceId;
  }

  private async findPostWorkspaceId(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return post?.workspace_id ?? null;
  }

  private async findMediaWorkspaceId(id: string) {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return media?.workspace_id ?? null;
  }

  private async findProjectWorkspaceId(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return project?.workspace_id ?? null;
  }

  private async findReportWorkspaceId(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return report?.workspace_id ?? null;
  }

  private async findReportConfigWorkspaceId(id: string) {
    const config = await this.prisma.reportConfig.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return config?.workspace_id ?? null;
  }

  private async findSocialAccountWorkspaceId(id: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return account?.workspace_id ?? null;
  }

  private async findApiKeyWorkspaceId(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return apiKey?.workspace_id ?? null;
  }

  private async findWebhookWorkspaceId(id: string) {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return endpoint?.workspace_id ?? null;
  }

  private async findWebhookDeliveryWorkspaceId(id: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id },
      select: {
        endpoint: {
          select: { workspace_id: true },
        },
      },
    });
    return delivery?.endpoint.workspace_id ?? null;
  }

  private async findCommentWorkspaceId(id: string) {
    const comment = await this.prisma.socialComment.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return comment?.workspace_id ?? null;
  }

  private async findCommentAssignmentWorkspaceId(id: string) {
    const assignment = await this.prisma.commentAssignment.findUnique({
      where: { id },
      select: {
        comment: {
          select: { workspace_id: true },
        },
      },
    });
    return assignment?.comment.workspace_id ?? null;
  }

  private getString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private getStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }
}
