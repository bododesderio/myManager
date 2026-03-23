import { Module } from '@nestjs/common';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService, PrismaService],
  exports: [ThemeService],
})
export class ThemeModule {}
