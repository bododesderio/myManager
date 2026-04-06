import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const requestMetrics = new Map<string, number>();

export function getRequestMetrics(): Map<string, number> {
  return requestMetrics;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const method: string = request.method ?? 'UNKNOWN';

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse();
          const statusCode: number = response.statusCode ?? 200;
          const key = `${method}:${statusCode}`;
          requestMetrics.set(key, (requestMetrics.get(key) ?? 0) + 1);
        },
        error: (err: { status?: number; getStatus?: () => number }) => {
          const statusCode =
            typeof err?.getStatus === 'function' ? err.getStatus() : err?.status ?? 500;
          const key = `${method}:${statusCode}`;
          requestMetrics.set(key, (requestMetrics.get(key) ?? 0) + 1);
        },
      }),
    );
  }
}
