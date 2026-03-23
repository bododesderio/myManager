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

    // Not authenticated yet (handled by JwtAuthGuard)
    if (!user) return true;

    // Superadmin bypasses workspace isolation
    if (user.is_superadmin) return true;

    const workspaceId =
      request.params?.workspaceId ??
      request.query?.workspaceId ??
      request.body?.workspaceId;

    // If no workspaceId in request, skip (non-workspace routes)
    if (!workspaceId) return true;

    const member = await this.prisma.workspaceMember.findFirst({
      where: { user_id: user.id, workspace_id: workspaceId, status: { not: 'REMOVED' } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    request.workspaceMember = member;
    return true;
  }
}
