import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>('requiredFeature', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const plan = request.plan;

    if (!plan || !plan.features) {
      throw new ForbiddenException(
        `This feature requires a paid plan. Please upgrade to access "${requiredFeature}".`,
      );
    }

    const hasFeature = plan.features[requiredFeature] === true;

    if (!hasFeature) {
      throw new ForbiddenException(
        `Your current plan does not include the "${requiredFeature}" feature. Please upgrade your plan.`,
      );
    }

    return true;
  }
}
