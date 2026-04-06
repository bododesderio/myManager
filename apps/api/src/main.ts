import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { requestTracingMiddleware } from './common/http/request-tracing.middleware';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const sentryDsn = process.env.SENTRY_DSN;

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    });
  }

  // Validate required env vars (hard = crash, soft = warn)
  const REQUIRED_ENV = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
  const RECOMMENDED_ENV = ['FLUTTERWAVE_WEBHOOK_SECRET', 'RESEND_API_KEY'];
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
  for (const key of RECOMMENDED_ENV) {
    if (!process.env[key]) {
      logger.warn(`Missing recommended env var: ${key} — related features will be disabled`);
    }
  }

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.use(helmet());
  app.use(cookieParser());
  app.use(requestTracingMiddleware);

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/v1/health', 'api/brand', 'metrics'],
  });

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [process.env.WEB_URL ?? 'http://localhost:3000'];
  if (process.env.MOBILE_ORIGIN) corsOrigins.push(process.env.MOBILE_ORIGIN);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new MetricsInterceptor());

  // Swagger API docs — disabled in production unless explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('MyManager API')
      .setDescription(
        'Social media management platform API.\n\n' +
        '**Modules:** Auth, Users, Workspaces, Posts, Publishing, Analytics, Media, ' +
        'Plans, Billing, Campaigns, Templates, Approvals, Projects, Reports, ' +
        'Social Accounts, Platforms, Comments, Notifications, Webhooks, API Keys, ' +
        'AI, Bio Pages, RSS, Listening, Competitors, CMS, Blog, FAQ, Testimonials, ' +
        'Newsletter, Contact, Theme, Portal, Admin Dashboard, System Config, Exchange Rates',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'ApiKey')
      .addTag('Auth', 'Authentication, login, registration, 2FA, password reset')
      .addTag('Users', 'User profile, preferences, push tokens')
      .addTag('Workspaces', 'Workspace management, members, invitations')
      .addTag('Posts', 'Create, schedule, update, delete posts')
      .addTag('Publishing', 'Multi-platform publishing pipeline')
      .addTag('Analytics', 'Workspace and post analytics')
      .addTag('Media', 'Media asset upload and management')
      .addTag('Plans', 'Subscription plan management')
      .addTag('Billing', 'Subscriptions, payments, invoices')
      .addTag('Campaigns', 'Multi-post campaign management')
      .addTag('Templates', 'Post templates')
      .addTag('Approvals', 'Content approval workflows')
      .addTag('Projects', 'Client project management')
      .addTag('Reports', 'Report generation and delivery')
      .addTag('Social Accounts', 'Connected social media accounts')
      .addTag('Platforms', 'Platform metadata and capabilities')
      .addTag('Comments', 'Social comment inbox')
      .addTag('Notifications', 'User notifications')
      .addTag('Webhooks', 'Outbound webhook management')
      .addTag('API Keys', 'Developer API key management')
      .addTag('AI', 'AI-powered content generation')
      .addTag('Bio Pages', 'Link-in-bio page builder')
      .addTag('RSS', 'RSS feed ingestion')
      .addTag('Listening', 'Social listening and mentions')
      .addTag('Competitors', 'Competitor benchmarking')
      .addTag('CMS', 'Content management system')
      .addTag('Blog', 'Public blog')
      .addTag('Admin', 'Admin dashboard and configuration')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
}
bootstrap();
