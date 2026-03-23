import { Module } from '@nestjs/common';
import { BioPagesController } from './bio-pages.controller';
import { BioPagesService } from './bio-pages.service';
import { BioPagesRepository } from './bio-pages.repository';

@Module({
  controllers: [BioPagesController],
  providers: [BioPagesService, BioPagesRepository],
  exports: [BioPagesService],
})
export class BioPagesModule {}
