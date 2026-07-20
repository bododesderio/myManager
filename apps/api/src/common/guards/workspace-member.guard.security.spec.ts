import { ForbiddenException } from '@nestjs/common';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * Regression tests for the two tenancy bypasses found in the 2026-07-20 audit
 * (docs/audit-2026-07-20.md §C2).
 *
 * These are the tests that would have caught the original vulnerabilities, so
 * they are deliberately written from the attacker's point of view.
 */
describe('WorkspaceMemberGuard — tenancy bypass regressions', () => {
  let guard: WorkspaceMemberGuard;
  let prisma: Record<string, any>;

  const ATTACKER_WS = 'ws_attacker';
  const VICTIM_WS = 'ws_victim';

  beforeEach(() => {
    prisma = {
      workspaceMember: { findFirst: jest.fn() },
      post: { findUnique: jest.fn() },
      project: { findUnique: jest.fn() },
      mediaAsset: { findUnique: jest.fn() },
      campaign: { findUnique: jest.fn() },
      postTemplate: { findUnique: jest.fn() },
      bioPage: { findUnique: jest.fn() },
      rssFeed: { findUnique: jest.fn() },
      competitorProfile: { findUnique: jest.fn() },
      listeningTerm: { findUnique: jest.fn() },
      report: { findUnique: jest.fn() },
      reportConfig: { findUnique: jest.fn() },
      socialAccount: { findUnique: jest.fn() },
      apiKey: { findUnique: jest.fn() },
      webhookEndpoint: { findUnique: jest.fn() },
      webhookDelivery: { findUnique: jest.fn() },
      socialComment: { findUnique: jest.fn() },
      commentAssignment: { findUnique: jest.fn() },
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
    method?: string;
  } = {}) {
    const request: Record<string, any> = {
      user: overrides.user !== undefined ? overrides.user : null,
      params: overrides.params ?? {},
      query: overrides.query ?? {},
      body: overrides.body ?? {},
      baseUrl: overrides.baseUrl ?? '',
      path: overrides.path ?? '/',
      method: overrides.method ?? 'GET',
      route: { path: overrides.routePath ?? overrides.path ?? '/' },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  }

  /** Attacker is a legitimate member of their OWN workspace only. */
  function attackerIsMemberOfOwnWorkspaceOnly() {
    prisma.workspaceMember.findFirst.mockImplementation(
      ({ where }: { where: { workspace_id: string } }) =>
        where.workspace_id === ATTACKER_WS
          ? Promise.resolve({ id: 'm1', workspace_id: ATTACKER_WS, role: 'OWNER' })
          : Promise.resolve(null),
    );
  }

  describe('Bypass A — caller-supplied workspaceId must not outrank resource ownership', () => {
    it('denies reading another workspace\'s post even when ?workspaceId points at the attacker\'s own workspace', async () => {
      attackerIsMemberOfOwnWorkspaceOnly();
      // The post genuinely belongs to the victim.
      prisma.post.findUnique.mockResolvedValue({ workspace_id: VICTIM_WS });

      const ctx = createContext({
        user: { id: 'attacker', is_superadmin: false },
        params: { id: 'victim_post_id' },
        query: { workspaceId: ATTACKER_WS }, // the attack payload
        routePath: '/posts/:id',
        baseUrl: '/api/v1',
      });

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
      // Membership must have been checked against the VICTIM workspace, not the
      // attacker-supplied one.
      expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspace_id: VICTIM_WS }),
        }),
      );
    });

    it('denies the template theft that escalated cross-tenant read into write', async () => {
      attackerIsMemberOfOwnWorkspaceOnly();
      prisma.postTemplate.findUnique.mockResolvedValue({ workspace_id: VICTIM_WS });

      const ctx = createContext({
        user: { id: 'attacker', is_superadmin: false },
        params: { id: 'victim_template_id' },
        body: { workspaceId: ATTACKER_WS },
        routePath: '/templates/:id/create-post',
        baseUrl: '/api/v1',
        method: 'POST',
      });

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
    });

    it('still allows access when the caller genuinely owns the resource', async () => {
      attackerIsMemberOfOwnWorkspaceOnly();
      prisma.post.findUnique.mockResolvedValue({ workspace_id: ATTACKER_WS });

      const ctx = createContext({
        user: { id: 'attacker', is_superadmin: false },
        params: { id: 'own_post_id' },
        routePath: '/posts/:id',
        baseUrl: '/api/v1',
      });

      await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
      expect(ctx.request.workspaceId).toBe(ATTACKER_WS);
    });
  });

  describe('Bypass B — workspace-scoped routes must fail closed', () => {
    const previouslyUnscoped: Array<[string, string]> = [
      ['campaign', '/campaigns/:id'],
      ['bioPage', '/bio-pages/:id'],
      ['rssFeed', '/rss/:id'],
      ['competitorProfile', '/competitors/:id'],
      ['listeningTerm', '/listening/:id'],
    ];

    it.each(previouslyUnscoped)(
      'denies cross-tenant access on %s routes (was fail-open)',
      async (model, routePath) => {
        attackerIsMemberOfOwnWorkspaceOnly();
        prisma[model].findUnique.mockResolvedValue({ workspace_id: VICTIM_WS });

        const ctx = createContext({
          user: { id: 'attacker', is_superadmin: false },
          params: { id: 'victim_resource' },
          routePath,
          baseUrl: '/api/v1',
        });

        await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
      },
    );

    it('denies a workspace-scoped route when the workspace cannot be resolved at all', async () => {
      attackerIsMemberOfOwnWorkspaceOnly();
      // Resource lookup returns nothing -> workspace unresolvable.
      prisma.campaign.findUnique.mockResolvedValue(null);

      const ctx = createContext({
        user: { id: 'attacker', is_superadmin: false },
        params: { id: 'nonexistent' },
        routePath: '/campaigns/:id',
        baseUrl: '/api/v1',
      });

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
    });

    it('still allows workspace-agnostic routes through (e.g. /auth, /users/me)', async () => {
      const ctx = createContext({
        user: { id: 'someone', is_superadmin: false },
        routePath: '/users/me',
        baseUrl: '/api/v1',
      });

      await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
      expect(prisma.workspaceMember.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('/workspaces/:id routes must keep working', () => {
    it('resolves the workspace from the :id param and allows a member', async () => {
      attackerIsMemberOfOwnWorkspaceOnly();

      const ctx = createContext({
        user: { id: 'attacker', is_superadmin: false },
        params: { id: ATTACKER_WS },
        routePath: '/workspaces/:id/approval-config',
        baseUrl: '/api/v1',
      });

      await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
      expect(ctx.request.workspaceId).toBe(ATTACKER_WS);
    });

    it('denies a non-member on /workspaces/:id routes', async () => {
      attackerIsMemberOfOwnWorkspaceOnly();

      const ctx = createContext({
        user: { id: 'attacker', is_superadmin: false },
        params: { id: VICTIM_WS },
        routePath: '/workspaces/:id/members',
        baseUrl: '/api/v1',
      });

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
    });
  });
});
