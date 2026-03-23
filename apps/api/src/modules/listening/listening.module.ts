import { Module } from '@nestjs/common';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';
import { ListeningRepository } from './listening.repository';

@Module({
  controllers: [ListeningController],
  providers: [ListeningService, ListeningRepository],
  exports: [ListeningService],
})
export class ListeningModule {}
