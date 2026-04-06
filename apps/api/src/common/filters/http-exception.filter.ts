import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & {
      requestId?: string;
      workspaceId?: string;
      user?: { id?: string; email?: string };
    }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message || resp.error || message) as string;
        errors = resp.errors || null;

        if (Array.isArray(message)) {
          errors = message;
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    // In production, never leak internal error details for 500s
    if (process.env.NODE_ENV === 'production' && status === 500) {
      message = 'Internal server error';
      errors = null;
    }

    const errorResponse = {
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId,
    };

    if (status >= 500) {
      Sentry.captureException(exception, {
        tags: {
          method: request.method,
          path: request.url,
          workspaceId: request.workspaceId ?? 'unknown',
        },
        user: request.user?.id ? { id: request.user.id, email: request.user.email } : undefined,
        extra: {
          requestId: request.requestId,
          errors,
        },
      });
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        JSON.stringify(errorResponse),
      );
    }

    response.status(status).json(errorResponse);
  }
}
