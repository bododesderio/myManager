import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Route prefixes that operate on workspace-scoped data. If a request matches one
 * of these but no workspace can be resolved, the request is denied rather than
 * allowed — a resolver gap must fail closed, not silently grant access.
 *
 * Routes NOT listed here (e.g. /auth, /users/me, /plans) are workspace-agnostic
 * and are allowed through untouched.
 */
const WORKSPACE_SCOPED_PREFIXES = [
  '/posts',
  '/media',
  '/projects',
  '/reports',
  '/social-accounts',
  '/api-keys',
  '/webhooks',
  '/comments',
  '/campaigns',
  '/templates',
  '/bio-pages',
  '/rss',
  '/competitors',
  '/listening',
  '/workspaces',
];

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceMemberGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() routes are workspace-agnostic by definition. Without this, a
    // route under a workspace-scoped prefix (e.g. the anonymous link-in-bio page
    // at /bio-pages/public/:slug) would hit the deny-by-default branch below
    // whenever the caller happened to be authenticated — a logged-in visitor
    // would get 403 on a page that works fine for everyone else.
    //
    // CsrfGuard and the JWT guard already honour this decorator; this guard not
    // doing so was an inconsistency waiting to bite.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;
    if (user.is_superadmin) return true;

    const workspaceId = await this.resolveWorkspaceId(request);

    if (!workspaceId) {
      // Fail closed: a workspace-scoped route with no resolvable workspace is a
      // resolver gap, not a public endpoint.
      if (this.isWorkspaceScopedRoute(request)) {
        this.logger.warn(
          `Denied ${request.method} ${this.routePath(request)} — workspace-scoped route with unresolvable workspace`,
        );
        throw new ForbiddenException('Workspace could not be determined for this request');
      }
      return true;
    }

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

  private routePath(request: {
    baseUrl?: string;
    path?: string;
    route?: { path?: string };
  }): string {
    return `${request.baseUrl ?? ''}${request.route?.path ?? request.path ?? ''}`.toLowerCase();
  }

  private isWorkspaceScopedRoute(request: {
    baseUrl?: string;
    path?: string;
    route?: { path?: string };
  }): boolean {
    const routePath = this.routePath(request);
    return WORKSPACE_SCOPED_PREFIXES.some((prefix) => routePath.includes(prefix));
  }

  private async resolveWorkspaceId(request: {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    baseUrl?: string;
    path?: string;
    route?: { path?: string };
  }): Promise<string | null> {
    // Resource ownership is authoritative and MUST be checked first. Trusting a
    // caller-supplied workspaceId ahead of the resource's real owner allowed
    // `GET /posts/<victim-id>?workspaceId=<attacker-workspace>` to pass the
    // membership check against the attacker's own workspace.
    const inferredWorkspaceId = await this.inferWorkspaceIdFromResource(request);
    if (inferredWorkspaceId) {
      return inferredWorkspaceId;
    }

    // Only fall back to an explicit id when there is no resource to infer from
    // (list and create routes, and /workspaces/:workspaceId/* itself).
    return this.getString(
      request.params?.workspaceId ??
      request.query?.workspaceId ??
      request.body?.workspaceId,
    );
  }

  private async inferWorkspaceIdFromResource(request: {
    params?: Record<string, unknown>;
    body?: Record<string, unknown>;
    baseUrl?: string;
    path?: string;
    route?: { path?: string };
  }): Promise<string | null> {
    const routePath = `${request.baseUrl ?? ''}${request.route?.path ?? request.path ?? ''}`.toLowerCase();

    // On /workspaces/:id/* the :id param IS the workspace id. Must be handled
    // before the generic branches, and before the explicit-param fallback —
    // these routes never carry a :workspaceId param.
    if (routePath.includes('/workspaces')) {
      const id = this.getString(request.params?.id);
      if (id) return id;
    }

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

    if (routePath.includes('/campaigns')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findCampaignWorkspaceId(id);
    }

    if (routePath.includes('/templates')) {
      // Covers POST /templates/:id/create-post, which previously copied the
      // source template's workspace_id — turning a cross-tenant read into a write.
      const id = this.getString(request.params?.id) ?? this.getString(request.body?.templateId);
      if (id) return this.findTemplateWorkspaceId(id);
    }

    if (routePath.includes('/bio-pages')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findBioPageWorkspaceId(id);
    }

    if (routePath.includes('/rss')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findRssFeedWorkspaceId(id);
    }

    if (routePath.includes('/competitors')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findCompetitorWorkspaceId(id);
    }

    if (routePath.includes('/listening')) {
      const id = this.getString(request.params?.id);
      if (id) return this.findListeningTermWorkspaceId(id);
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

  private async findCampaignWorkspaceId(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return campaign?.workspace_id ?? null;
  }

  private async findTemplateWorkspaceId(id: string) {
    const template = await this.prisma.postTemplate.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return template?.workspace_id ?? null;
  }

  private async findBioPageWorkspaceId(id: string) {
    const page = await this.prisma.bioPage.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return page?.workspace_id ?? null;
  }

  private async findRssFeedWorkspaceId(id: string) {
    const feed = await this.prisma.rssFeed.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return feed?.workspace_id ?? null;
  }

  private async findCompetitorWorkspaceId(id: string) {
    const competitor = await this.prisma.competitorProfile.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return competitor?.workspace_id ?? null;
  }

  private async findListeningTermWorkspaceId(id: string) {
    const term = await this.prisma.listeningTerm.findUnique({
      where: { id },
      select: { workspace_id: true },
    });
    return term?.workspace_id ?? null;
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
