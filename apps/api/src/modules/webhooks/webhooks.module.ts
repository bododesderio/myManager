import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksRepository } from './webhooks.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule, BullModule.registerQueue({ name: 'webhook-delivery' })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksRepository],
  exports: [WebhooksService],
})
export class WebhooksModule {}
