import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('Worker');

  const REQUIRED_ENV = ['DATABASE_URL', 'REDIS_URL'];
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  const app = await NestFactory.createApplicationContext(WorkerModule);

  app.enableShutdownHooks();

  logger.log('Worker processes started — listening for queue jobs and cron schedules');

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — shutting down worker gracefully');
    await app.close();
  });
}

bootstrap();
