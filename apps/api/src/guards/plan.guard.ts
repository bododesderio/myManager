import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const requiredPlans = this.reflector.getAllAndOverride<string[]>('requiredPlans', targets);
    const requiredFeature = this.reflector.getAllAndOverride<string>('requiredFeature', targets);
    const quotaType = this.reflector.getAllAndOverride<string>('quotaType', targets);

    // Resolve the plan (two DB queries) only when a downstream check needs it —
    // @RequirePlan (here), @RequireFeature (FeatureGuard) or @RequireQuota
    // (QuotaGuard). Routes with none of these pay nothing for this guard.
    if (!requiredPlans && !requiredFeature && !quotaType) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // public/unauthenticated route

    const plan = await this.resolvePlan(user.id);
    request.plan = plan;

    if (requiredPlans && requiredPlans.length > 0) {
      const slug = (plan as { slug?: string }).slug;
      if (!slug || !requiredPlans.includes(slug)) {
        throw new ForbiddenException(
          `This action requires one of the following plans: ${requiredPlans.join(', ')}. Please upgrade your plan.`,
        );
      }
    }

    return true;
  }

  private async resolvePlan(userId: string): Promise<Record<string, unknown>> {
    const override = await this.prisma.planOverride.findFirst({
      where: { user_id: userId },
      include: { plan: true },
      orderBy: { created_at: 'desc' },
    });

    if (override && (!override.override_until || override.override_until > new Date())) {
      return {
        ...override.plan,
        source: 'override',
        limits: override.plan.limits,
        features: override.plan.features,
      };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!subscription) {
      const freePlan = await this.prisma.plan.findUnique({ where: { slug: 'free' } });
      return {
        ...freePlan,
        source: 'free_fallback',
        limits: freePlan?.limits || {},
        features: freePlan?.features || {},
      };
    }

    return {
      ...subscription.plan,
      source: 'subscription',
      limits: subscription.locked_limits || subscription.plan.limits,
      features: subscription.locked_features || subscription.plan.features,
    };
  }
}
