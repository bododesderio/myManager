import { AuthRepository } from './auth.repository';

/** Builds a repository whose prisma.$transaction runs the callback against the
 *  provided fake `tx`, so the reuse-detection branching can be exercised without
 *  a database. */
function makeRepo(tx: any) {
  const prisma = {
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  } as any;
  return { repo: new AuthRepository(prisma), prisma };
}

const now = new Date('2026-07-21T00:00:00Z');
const future = new Date('2026-07-28T00:00:00Z');
const past = new Date('2026-07-01T00:00:00Z');

describe('AuthRepository.consumeRefreshToken — rotation with reuse detection', () => {
  it('rotates a valid, unused, unexpired token and marks it used', async () => {
    const tx = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'u1', used_at: null, revoked_at: null, expires_at: future,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const { repo } = makeRepo(tx);

    const res = await repo.consumeRefreshToken('hash', now);

    expect(res).toEqual({ status: 'rotated', userId: 'u1' });
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { token_hash: 'hash', used_at: null, revoked_at: null },
      data: { used_at: now },
    });
  });

  it('flags reuse when the token was already used (never re-issues)', async () => {
    const tx = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'u1', used_at: now, revoked_at: null, expires_at: future,
        }),
        updateMany: jest.fn(),
      },
    };
    const { repo } = makeRepo(tx);

    expect(await repo.consumeRefreshToken('hash', now)).toEqual({ status: 'reuse', userId: 'u1' });
    expect(tx.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('flags reuse when the token was revoked', async () => {
    const tx = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'u1', used_at: null, revoked_at: now, expires_at: future,
        }),
        updateMany: jest.fn(),
      },
    };
    const { repo } = makeRepo(tx);

    expect(await repo.consumeRefreshToken('hash', now)).toEqual({ status: 'reuse', userId: 'u1' });
  });

  it('returns invalid for an unknown token', async () => {
    const tx = { refreshToken: { findUnique: jest.fn().mockResolvedValue(null), updateMany: jest.fn() } };
    const { repo } = makeRepo(tx);

    expect(await repo.consumeRefreshToken('hash', now)).toEqual({ status: 'invalid' });
  });

  it('returns invalid for an expired (but otherwise clean) token', async () => {
    const tx = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'u1', used_at: null, revoked_at: null, expires_at: past,
        }),
        updateMany: jest.fn(),
      },
    };
    const { repo } = makeRepo(tx);

    expect(await repo.consumeRefreshToken('hash', now)).toEqual({ status: 'invalid' });
    expect(tx.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('treats a lost update race (count 0) as reuse — fails safe', async () => {
    const tx = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'u1', used_at: null, revoked_at: null, expires_at: future,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const { repo } = makeRepo(tx);

    expect(await repo.consumeRefreshToken('hash', now)).toEqual({ status: 'reuse', userId: 'u1' });
  });
});

describe('AuthRepository revoke/prune helpers', () => {
  it('revokeRefreshToken only touches live rows for that hash', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const repo = new AuthRepository({ refreshToken: { updateMany } } as any);

    await repo.revokeRefreshToken('hash', now);

    expect(updateMany).toHaveBeenCalledWith({
      where: { token_hash: 'hash', revoked_at: null },
      data: { revoked_at: now },
    });
  });

  it('revokeAllRefreshTokensForUser revokes every live token for the user', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 3 });
    const repo = new AuthRepository({ refreshToken: { updateMany } } as any);

    await repo.revokeAllRefreshTokensForUser('u1', now);

    expect(updateMany).toHaveBeenCalledWith({
      where: { user_id: 'u1', revoked_at: null },
      data: { revoked_at: now },
    });
  });

  it('deleteExpiredRefreshTokens removes only rows past expiry', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 5 });
    const repo = new AuthRepository({ refreshToken: { deleteMany } } as any);

    await repo.deleteExpiredRefreshTokens(now);

    expect(deleteMany).toHaveBeenCalledWith({ where: { expires_at: { lt: now } } });
  });
});
