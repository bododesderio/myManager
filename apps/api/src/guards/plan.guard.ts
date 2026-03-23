import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    const plan = await this.resolvePlan(user.id);
    request.plan = plan;

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
