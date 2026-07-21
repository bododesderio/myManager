import { ForbiddenException } from '@nestjs/common';
import { PlanGuard } from './plan.guard';

/** Builds an ExecutionContext whose request is `req`, plus a Reflector that
 *  returns the given metadata for the three keys PlanGuard inspects. */
function makeContext(req: any, meta: { requiredPlans?: string[]; requiredFeature?: string; quotaType?: string } = {}) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => (meta as any)[key]),
  } as any;
  const context = {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => req }),
  } as any;
  return { reflector, context };
}

describe('PlanGuard', () => {
  it('skips all DB work and allows when no plan/feature/quota decorator is present', async () => {
    const prisma = { planOverride: { findFirst: jest.fn() }, subscription: { findFirst: jest.fn() }, plan: { findUnique: jest.fn() } } as any;
    const req: any = { user: { id: 'u1' } };
    const { reflector, context } = makeContext(req, {});
    const guard = new PlanGuard(prisma, reflector);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.planOverride.findFirst).not.toHaveBeenCalled();
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
    expect(req.plan).toBeUndefined();
  });

  it('resolves and attaches the plan when a quota decorator is present', async () => {
    const prisma = {
      planOverride: { findFirst: jest.fn().mockResolvedValue(null) },
      subscription: { findFirst: jest.fn().mockResolvedValue(null) },
      plan: { findUnique: jest.fn().mockResolvedValue({ slug: 'free', limits: {}, features: {} }) },
    } as any;
    const req: any = { user: { id: 'u1' } };
    const { reflector, context } = makeContext(req, { quotaType: 'posts' });
    const guard = new PlanGuard(prisma, reflector);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.plan.slug).toBe('free');
    expect(req.plan.source).toBe('free_fallback');
  });

  it('enforces @RequirePlan — allows a matching plan', async () => {
    const prisma = {
      planOverride: { findFirst: jest.fn().mockResolvedValue(null) },
      subscription: {
        findFirst: jest.fn().mockResolvedValue({ plan: { slug: 'pro', limits: {}, features: {} }, locked_limits: null, locked_features: null }),
      },
      plan: { findUnique: jest.fn() },
    } as any;
    const req: any = { user: { id: 'u1' } };
    const { reflector, context } = makeContext(req, { requiredPlans: ['pro', 'enterprise'] });
    const guard = new PlanGuard(prisma, reflector);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.plan.slug).toBe('pro');
  });

  it('enforces @RequirePlan — forbids a non-matching plan', async () => {
    const prisma = {
      planOverride: { findFirst: jest.fn().mockResolvedValue(null) },
      subscription: { findFirst: jest.fn().mockResolvedValue(null) },
      plan: { findUnique: jest.fn().mockResolvedValue({ slug: 'free', limits: {}, features: {} }) },
    } as any;
    const req: any = { user: { id: 'u1' } };
    const { reflector, context } = makeContext(req, { requiredPlans: ['pro'] });
    const guard = new PlanGuard(prisma, reflector);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows (does not resolve) an unauthenticated request even with a decorator', async () => {
    const prisma = { planOverride: { findFirst: jest.fn() }, subscription: { findFirst: jest.fn() }, plan: { findUnique: jest.fn() } } as any;
    const req: any = {}; // no user
    const { reflector, context } = makeContext(req, { requiredFeature: 'advanced' });
    const guard = new PlanGuard(prisma, reflector);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.planOverride.findFirst).not.toHaveBeenCalled();
  });
});
