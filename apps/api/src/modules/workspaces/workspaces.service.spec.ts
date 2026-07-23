import { BadRequestException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

/** Regression test: GET /workspaces must return workspace objects whose `id` is
 *  the workspace id (the client passes it as workspaceId on every scoped call),
 *  not the raw membership rows whose `id` is the membership id. */
describe('WorkspacesService.listForUser', () => {
  it('flattens memberships to workspaces (id = workspace id) with the role', async () => {
    const repository = {
      findByUserId: jest.fn().mockResolvedValue([
        {
          id: 'member-1',
          user_id: 'u1',
          workspace_id: 'ws-1',
          role: 'OWNER',
          status: 'ACTIVE',
          workspace: { id: 'ws-1', name: "Keza's Workspace", slug: 'kezas-workspace' },
        },
      ]),
    } as any;
    const service = new WorkspacesService(repository);

    const result = await service.listForUser('u1');

    expect(result).toEqual([
      { id: 'ws-1', name: "Keza's Workspace", slug: 'kezas-workspace', role: 'OWNER' },
    ]);
    // The membership id must NOT leak through as the item id.
    expect(result[0].id).toBe('ws-1');
    expect(result[0].id).not.toBe('member-1');
  });
});

/** The web sends role values that must land as canonical WorkspaceRole enum
 *  members (OWNER/ADMIN/MEMBER). A stray value must 400, not reach Prisma and
 *  500 on an invalid enum. OWNER is not assignable via these paths. */
describe('WorkspacesService.updateMemberRole role normalization', () => {
  function makeService() {
    const repository = {
      findMember: jest.fn().mockResolvedValue({ role: 'OWNER' }), // actor is owner
      updateMemberRole: jest.fn().mockResolvedValue({ id: 'm2', role: 'ADMIN' }),
    } as any;
    return { service: new WorkspacesService(repository), repository };
  }

  it('uppercases a lowercase role before persisting', async () => {
    const { service, repository } = makeService();
    await service.updateMemberRole('ws-1', 'm2', 'admin', 'owner-1');
    expect(repository.updateMemberRole).toHaveBeenCalledWith('ws-1', 'm2', 'ADMIN');
  });

  it('rejects a non-enum role with 400 (never reaches the repository)', async () => {
    const { service, repository } = makeService();
    await expect(
      service.updateMemberRole('ws-1', 'm2', 'editor', 'owner-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateMemberRole).not.toHaveBeenCalled();
  });

  it('rejects assigning OWNER via role change', async () => {
    const { service } = makeService();
    await expect(
      service.updateMemberRole('ws-1', 'm2', 'OWNER', 'owner-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
