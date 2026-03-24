import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Double-submit cookie CSRF protection.
 * Skips GET/HEAD/OPTIONS requests and routes marked @Public().
 * Compares the `x-csrf-token` header against the `_csrf` cookie.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Safe methods don't need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Skip for public routes (they don't have session context)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Skip for API key authenticated requests (no cookies involved)
    const authHeader = request.headers.authorization || '';
    if (authHeader.startsWith('ApiKey ')) return true;

    const cookieToken = request.cookies?.['_csrf'];
    const headerToken = request.headers['x-csrf-token'] as string;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('Missing CSRF token');
    }

    if (cookieToken.length !== headerToken.length) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const valid = timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken),
    );

    if (!valid) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
