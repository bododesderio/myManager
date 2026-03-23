import { Module } from '@nestjs/common';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TestimonialsController],
  providers: [TestimonialsService, PrismaService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
