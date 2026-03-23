import { Module } from '@nestjs/common';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [FaqController],
  providers: [FaqService, PrismaService],
  exports: [FaqService],
})
export class FaqModule {}
