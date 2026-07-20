import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

/**
 * Repository-level tenancy scoping (docs/audit-2026-07-20.md §C2, Phase 2).
 *
 * Phase 0 fixed the guard, but a guard carries a hand-maintained route list that
 * rots the moment someone adds a module. These tests pin the durable property:
 * the workspace id reaches the WHERE clause, so the database enforces tenancy
 * even if the guard is bypassed or a new route forgets it.
 */
describe('TemplatesService — workspace scoping', () => {
  const OWN_WS = 'ws_own';
  const OTHER_WS = 'ws_other';

  function createService(overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(false),
      createPost: jest.fn().mockResolvedValue({ id: 'post_1' }),
      findByWorkspace: jest.fn(),
      create: jest.fn(),
      ...overrides,
    };
    return { service: new TemplatesService(repository as any), repository };
  }

  it('passes the workspace id into every read', async () => {
    const { service, repository } = createService({
      findById: jest.fn().mockResolvedValue({ id: 't1', workspace_id: OWN_WS }),
    });

    await service.getById('t1', OWN_WS);

    expect(repository.findById).toHaveBeenCalledWith('t1', OWN_WS);
  });

  it('reports another workspace\'s template as not found', async () => {
    // Repository returns null because the WHERE clause excluded it.
    const { service } = createService();

    await expect(service.getById('victim_template', OWN_WS)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not distinguish "wrong workspace" from "does not exist" on update', async () => {
    const { service, repository } = createService();

    await expect(
      service.update('victim_template', OWN_WS, { name: 'pwned' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).toHaveBeenCalledWith('victim_template', OWN_WS, {
      name: 'pwned',
    });
  });

  it('refuses to delete across workspaces', async () => {
    const { service } = createService();

    await expect(service.delete('victim_template', OWN_WS)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks the read-to-write escalation via createPostFromTemplate', async () => {
    // The original bug: an unscoped lookup returned the victim's template, and
    // its workspace_id was then copied onto a newly created post.
    const { service, repository } = createService();

    await expect(
      service.createPostFromTemplate('victim_template', 'attacker', OWN_WS),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.findById).toHaveBeenCalledWith('victim_template', OWN_WS);
    expect(repository.createPost).not.toHaveBeenCalled();
  });

  it('still creates a post from a template the caller owns', async () => {
    const { service, repository } = createService({
      findById: jest.fn().mockResolvedValue({
        id: 't1',
        workspace_id: OWN_WS,
        caption: 'hello',
        platforms: ['x'],
        content_type: 'text',
        metadata: {},
      }),
    });

    await service.createPostFromTemplate('t1', 'user_1', OWN_WS);

    expect(repository.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ workspace_id: OWN_WS, user_id: 'user_1' }),
    );
  });

  it('never writes a post into a workspace other than the caller\'s', async () => {
    // Defence in depth: even if a stale row somehow carried a foreign
    // workspace_id, the scoped read is what prevents it being reachable.
    const { service, repository } = createService({
      findById: jest.fn().mockImplementation((id: string, workspaceId: string) =>
        workspaceId === OTHER_WS
          ? Promise.resolve({
              id,
              workspace_id: OTHER_WS,
              caption: 'x',
              platforms: [],
              content_type: 'text',
              metadata: {},
            })
          : Promise.resolve(null),
      ),
    });

    await expect(
      service.createPostFromTemplate('t1', 'attacker', OWN_WS),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createPost).not.toHaveBeenCalled();
  });
});
