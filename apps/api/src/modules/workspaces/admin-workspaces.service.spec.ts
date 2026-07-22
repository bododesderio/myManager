import { WorkspacesService } from './workspaces.service';

/**
 * Regression tests for GET /admin/workspaces (WorkspacesService.listAllForAdmin).
 *
 * The superadmin Workspaces page renders a fixed row shape
 * ({ id, name, ownerEmail, plan, memberCount, postCount, createdAt }); the
 * endpoint 404'd entirely before this was built. These pin the mapping and its
 * fallbacks so a workspace with no owner or no subscription still renders.
 */
describe('WorkspacesService.listAllForAdmin', () => {
  function createService(rows: unknown[], total: number) {
    const repository = {
      findAllForAdmin: jest.fn().mockResolvedValue([rows, total]),
    } as any;
    return { service: new WorkspacesService(repository), repository };
  }

  it('maps rows to the admin table shape the page expects', async () => {
    const { service } = createService(
      [
        {
          id: 'ws-1',
          name: 'Acme Agency',
          created_at: '2026-07-21T00:00:00.000Z',
          owner: { email: 'agency@mymanager.app', name: 'Acme' },
          subscriptions: [{ plan: { name: 'Enterprise' } }],
          _count: { members: 4, posts: 12 },
        },
      ],
      1,
    );

    const { data } = await service.listAllForAdmin(1, 50);

    expect(data).toEqual([
      {
        id: 'ws-1',
        name: 'Acme Agency',
        ownerEmail: 'agency@mymanager.app',
        plan: 'Enterprise',
        memberCount: 4,
        postCount: 12,
        createdAt: '2026-07-21T00:00:00.000Z',
      },
    ]);
  });

  it('falls back gracefully when owner, subscription and counts are absent', async () => {
    const { service } = createService(
      [{ id: 'ws-2', name: 'Orphan', created_at: 'd', owner: null, subscriptions: [], _count: undefined }],
      1,
    );

    const { data } = await service.listAllForAdmin(1, 50);

    expect(data[0].ownerEmail).toBe('—');
    expect(data[0].plan).toBe('Free');
    expect(data[0].memberCount).toBe(0);
    expect(data[0].postCount).toBe(0);
  });

  it('computes the pagination offset and totalPages', async () => {
    const { service, repository } = createService([], 130);

    const { pagination } = await service.listAllForAdmin(3, 50);

    // page 3, limit 50 -> offset 100
    expect(repository.findAllForAdmin).toHaveBeenCalledWith(100, 50);
    expect(pagination).toEqual({ page: 3, limit: 50, total: 130, totalPages: 3 });
  });
});
