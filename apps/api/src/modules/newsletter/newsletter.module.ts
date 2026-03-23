import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, PrismaService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
