import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user context found');
    }

    // Superadmin bypasses workspace role checks
    if (user.is_superadmin) return true;

    const workspaceId =
      request.workspaceMember?.workspace_id ??
      request.workspaceId ??
      request.params?.workspaceId ??
      request.query?.workspaceId ??
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace context required');
    }

    const member = await this.prisma.workspaceMember.findFirst({
      where: { user_id: user.id, workspace_id: workspaceId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    const hasRole = requiredRoles.some(
      (role) => member.role.toLowerCase() === role.toLowerCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Required workspace role: ${requiredRoles.join(' or ')}`,
      );
    }

    request.workspaceId = workspaceId;
    request.workspaceMember = member;
    return true;
  }
}
