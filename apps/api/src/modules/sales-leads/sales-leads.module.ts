import { Module } from '@nestjs/common';
import { SalesLeadsController } from './sales-leads.controller';
import { SalesLeadsService } from './sales-leads.service';
import { SalesLeadsRepository } from './sales-leads.repository';

@Module({
  controllers: [SalesLeadsController],
  providers: [SalesLeadsService, SalesLeadsRepository],
  exports: [SalesLeadsService],
})
export class SalesLeadsModule {}
