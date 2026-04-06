import { ForbiddenException } from '@nestjs/common';
import { WorkspaceMemberGuard } from './workspace-member.guard';

describe('WorkspaceMemberGuard', () => {
  let guard: WorkspaceMemberGuard;
  let prisma: Record<string, any>;

  beforeEach(() => {
    prisma = {
      workspaceMember: { findFirst: jest.fn() },
      post: { findUnique: jest.fn() },
      project: { findUnique: jest.fn() },
      mediaAsset: { findUnique: jest.fn() },
    };

    guard = new WorkspaceMemberGuard(prisma as any);
  });

  function createContext(overrides: {
    user?: Record<string, any> | null;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
    baseUrl?: string;
    path?: string;
    routePath?: string;
  } = {}) {
    const request: Record<string, any> = {
      user: overrides.user !== undefined ? overrides.user : null,
      params: overrides.params ?? {},
      query: overrides.query ?? {},
      body: overrides.body ?? {},
      baseUrl: overrides.baseUrl ?? '',
      path: overrides.path ?? '/',
      route: { path: overrides.routePath ?? overrides.path ?? '/' },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  }

  it('should allow when no user (public route)', async () => {
    const ctx = createContext({ user: null });
    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
  });

  it('should allow superadmin users', async () => {
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: true },
      params: { workspaceId: 'ws_1' },
    });
    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
    expect(prisma.workspaceMember.findFirst).not.toHaveBeenCalled();
  });

  it('should allow active workspace members', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({
      id: 'wm_1',
      user_id: 'u1',
      workspace_id: 'ws_1',
      status: 'ACTIVE',
    });
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      params: { workspaceId: 'ws_1' },
    });

    const result = await guard.canActivate(ctx as any);

    expect(result).toBe(true);
    expect(ctx.request.workspaceId).toBe('ws_1');
    expect(ctx.request.workspaceMember).toBeDefined();
    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith({
      where: { user_id: 'u1', workspace_id: 'ws_1', status: { not: 'REMOVED' } },
    });
  });

  it('should reject non-members', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue(null);
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      params: { workspaceId: 'ws_1' },
    });

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('should resolve workspace from params', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({ id: 'wm_1' });
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      params: { workspaceId: 'ws_from_params' },
    });

    await guard.canActivate(ctx as any);

    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspace_id: 'ws_from_params' }),
      }),
    );
  });

  it('should resolve workspace from query', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({ id: 'wm_1' });
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      query: { workspaceId: 'ws_from_query' },
    });

    await guard.canActivate(ctx as any);

    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspace_id: 'ws_from_query' }),
      }),
    );
  });

  it('should resolve workspace from body', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({ id: 'wm_1' });
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      body: { workspaceId: 'ws_from_body' },
    });

    await guard.canActivate(ctx as any);

    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspace_id: 'ws_from_body' }),
      }),
    );
  });

  it('should infer workspace from post resource', async () => {
    prisma.post.findUnique.mockResolvedValue({ workspace_id: 'ws_post' });
    prisma.workspaceMember.findFirst.mockResolvedValue({ id: 'wm_1' });
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      params: { id: 'post_123' },
      baseUrl: '/api',
      routePath: '/posts/:id',
    });

    await guard.canActivate(ctx as any);

    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: 'post_123' },
      select: { workspace_id: true },
    });
    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspace_id: 'ws_post' }),
      }),
    );
  });

  it('should allow when no workspace can be resolved', async () => {
    const ctx = createContext({
      user: { id: 'u1', is_superadmin: false },
      baseUrl: '/api',
      routePath: '/health',
    });

    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
    expect(prisma.workspaceMember.findFirst).not.toHaveBeenCalled();
  });
});
