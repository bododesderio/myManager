import { Module } from '@nestjs/common';
import { AdminTranslationsController } from './admin-translations.controller';
import { TranslationsService } from './translations.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AdminTranslationsController],
  providers: [TranslationsService, PrismaService],
})
export class TranslationsModule {}
