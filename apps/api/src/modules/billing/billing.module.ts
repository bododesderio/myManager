import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { AdminBillingController } from './admin-billing.controller';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [BillingController, AdminBillingController],
  providers: [BillingService, BillingRepository],
  exports: [BillingService],
})
export class BillingModule {}
