import { PostsRepository } from './posts.repository';

/** Regression test: clients send ?status=draft (lowercase) but PostStatus is an
 *  uppercase Prisma enum. findByWorkspace must normalize case-insensitively and
 *  drop an unrecognized value, rather than passing it to Prisma (→ 500). */
function makeRepo() {
  const findMany = jest.fn().mockResolvedValue([]);
  const count = jest.fn().mockResolvedValue(0);
  const prisma = { post: { findMany, count } } as any;
  return { repo: new PostsRepository(prisma), findMany, count };
}

describe('PostsRepository.findByWorkspace status normalization', () => {
  it('uppercases a lowercase status to the PostStatus enum', async () => {
    const { repo, findMany } = makeRepo();

    await repo.findByWorkspace('ws-1', { status: 'draft' }, 0, 20);

    expect(findMany.mock.calls[0][0].where).toMatchObject({
      workspace_id: 'ws-1',
      status: 'DRAFT',
    });
  });

  it('accepts an already-uppercase status', async () => {
    const { repo, findMany } = makeRepo();
    await repo.findByWorkspace('ws-1', { status: 'SCHEDULED' }, 0, 20);
    expect(findMany.mock.calls[0][0].where.status).toBe('SCHEDULED');
  });

  it('ignores an unrecognized status instead of throwing', async () => {
    const { repo, findMany } = makeRepo();
    await repo.findByWorkspace('ws-1', { status: 'bogus' }, 0, 20);
    expect(findMany.mock.calls[0][0].where).not.toHaveProperty('status');
  });

  it('applies no status filter when none is given', async () => {
    const { repo, findMany } = makeRepo();
    await repo.findByWorkspace('ws-1', {}, 0, 20);
    expect(findMany.mock.calls[0][0].where).toEqual({ workspace_id: 'ws-1' });
  });
});
