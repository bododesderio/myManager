import { NotFoundException } from '@nestjs/common';

// The constructor falls back to local storage when R2 is unconfigured and
// mkdirSync's the upload dir. Stubbed so these tests touch no real filesystem.
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  promises: { writeFile: jest.fn(), unlink: jest.fn() },
}));

import { MediaService } from './media.service';

/**
 * Repository-level tenancy scoping for media (docs/audit-2026-07-20.md §C2).
 *
 * bulkDelete was the sharpest hole found in Phase 2: it deleted by id alone, so
 * a caller could pass another workspace's media ids and destroy their assets —
 * including the objects in R2, which is unrecoverable.
 */
describe('MediaService — workspace scoping', () => {
  const OWN_WS = 'ws_own';

  function createService(overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn().mockResolvedValue([]),
      bulkDelete: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn().mockResolvedValue(true),
      ...overrides,
    };

    const config = {
      get: jest.fn().mockImplementation((key: string, fallback?: unknown) => {
        // R2 unconfigured -> local storage path must still resolve, or
        // path.join() throws before the scoping logic is reached.
        if (key === 'LOCAL_STORAGE_PATH') return '/tmp/media-test';
        return fallback;
      }),
    };

    const service = new MediaService(
      repository as any,
      config as any,
      { add: jest.fn() } as any,
    );
    return { service, repository };
  }

  it('scopes every single-asset read to the caller\'s workspace', async () => {
    const { service, repository } = createService({
      findById: jest.fn().mockResolvedValue({ id: 'm1', workspace_id: OWN_WS, r2_key: 'k' }),
    });

    await service.getById('m1', OWN_WS);

    expect(repository.findById).toHaveBeenCalledWith('m1', OWN_WS);
  });

  it('reports another workspace\'s asset as not found', async () => {
    const { service } = createService();

    await expect(service.getById('victim_asset', OWN_WS)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('bulkDelete', () => {
    it('passes the workspace id to both the fetch and the delete', async () => {
      const { service, repository } = createService({
        findByIds: jest.fn().mockResolvedValue([]),
        bulkDelete: jest.fn().mockResolvedValue({ count: 0 }),
      });

      await service.bulkDelete(['victim_1', 'victim_2'], OWN_WS);

      expect(repository.findByIds).toHaveBeenCalledWith(['victim_1', 'victim_2'], OWN_WS);
      expect(repository.bulkDelete).toHaveBeenCalledWith(['victim_1', 'victim_2'], OWN_WS);
    });

    it('never touches storage for assets outside the workspace', async () => {
      // Scoped fetch returns nothing, so the storage-delete loop has no objects
      // to act on — this is what stops an unrecoverable R2 deletion.
      const { service, repository } = createService();

      const result = await service.bulkDelete(['victim_1'], OWN_WS);

      expect(repository.findByIds).toHaveBeenCalledWith(['victim_1'], OWN_WS);
      expect(result.deleted).toBe(0);
    });

    it('reports what was actually deleted, not what was requested', async () => {
      // Two ids requested, only one belonged to this workspace.
      const { service } = createService({
        findByIds: jest.fn().mockResolvedValue([
          { id: 'mine', workspace_id: OWN_WS, r2_key: 'k1' },
        ]),
        bulkDelete: jest.fn().mockResolvedValue({ count: 1 }),
      });

      const result = await service.bulkDelete(['mine', 'theirs'], OWN_WS);

      expect(result.deleted).toBe(1);
    });
  });
});
