import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

type RequestUser = { id: string };
type RequestWorkspaceMember = { workspace_id: string };

type WorkspaceRequest = Request & {
  user?: RequestUser;
  workspaceId?: string;
  workspaceMember?: RequestWorkspaceMember;
};

export function getRequestUserId(request: Request): string {
  const userId = (request as WorkspaceRequest).user?.id;
  if (!userId) {
    throw new ForbiddenException('No user context found');
  }
  return userId;
}

export function getRequestWorkspaceId(request: Request): string {
  const workspaceRequest = request as WorkspaceRequest;
  const workspaceId = workspaceRequest.workspaceMember?.workspace_id ?? workspaceRequest.workspaceId;
  if (!workspaceId) {
    throw new ForbiddenException('Workspace context required');
  }
  return workspaceId;
}
