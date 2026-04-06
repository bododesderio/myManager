import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('HttpRequest');

export function requestTracingMiddleware(
  request: Request & { requestId?: string },
  response: Response,
  next: NextFunction,
) {
  const requestId = request.headers['x-request-id']?.toString() || randomUUID();
  const startedAt = Date.now();

  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);

  response.on('finish', () => {
    logger.log(JSON.stringify({
      requestId,
      method: request.method,
      path: request.originalUrl || request.url,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      userAgent: request.get('user-agent') || null,
      workspaceId: (request as Request & { workspaceId?: string }).workspaceId ?? null,
      userId: (request as Request & { user?: { id?: string } }).user?.id ?? null,
    }));
  });

  next();
}
