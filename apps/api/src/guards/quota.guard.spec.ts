import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QuotaGuard } from './quota.guard';

function makeContext(handler: any, request: any) {
  return {
    getHandler: () => handler,
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

describe('QuotaGuard', () => {
  function makeGuard(prismaCount: number) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('posts'),
    } as unknown as Reflector;
    const prisma = {
      post: { count: jest.fn().mockResolvedValue(prismaCount) },
      socialAccount: { count: jest.fn() },
      workspaceMember: { count: jest.fn() },
      mediaAsset: { aggregate: jest.fn() },
      aiCreditUsage: { aggregate: jest.fn() },
      project: { count: jest.fn() },
    } as any;
    return new QuotaGuard(reflector, prisma);
  }

  const baseRequest = {
    plan: { slug: 'pro', limits: { postsPerMonth: 100 } },
    user: { id: 'user_1' },
    workspaceMember: { workspace_id: 'ws_1' },
  };

  it('allows when under limit', async () => {
    const guard = makeGuard(50);
    await expect(guard.canActivate(makeContext({}, baseRequest))).resolves.toBe(true);
  });

  it('blocks when at the limit (next creation would exceed)', async () => {
    const guard = makeGuard(100);
    await expect(guard.canActivate(makeContext({}, baseRequest))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('treats limit -1 as unlimited', async () => {
    const guard = makeGuard(9_999);
    const req = { ...baseRequest, plan: { slug: 'enterprise', limits: { postsPerMonth: -1 } } };
    await expect(guard.canActivate(makeContext({}, req))).resolves.toBe(true);
  });

  it('allows + warns when limit is null/undefined', async () => {
    const guard = makeGuard(50);
    const warnSpy = jest.spyOn((guard as any).logger, 'warn').mockImplementation(() => {});
    const req = { ...baseRequest, plan: { slug: 'broken', limits: {} } };
    await expect(guard.canActivate(makeContext({}, req))).resolves.toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('coerces numeric strings', async () => {
    const guard = makeGuard(99);
    const req = { ...baseRequest, plan: { slug: 'pro', limits: { postsPerMonth: '100' } } };
    await expect(guard.canActivate(makeContext({}, req))).resolves.toBe(true);
  });
});
