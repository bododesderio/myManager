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
