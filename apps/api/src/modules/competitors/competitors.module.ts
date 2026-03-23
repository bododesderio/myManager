import { Module } from '@nestjs/common';
import { CompetitorsController } from './competitors.controller';
import { CompetitorsService } from './competitors.service';
import { CompetitorsRepository } from './competitors.repository';

@Module({
  controllers: [CompetitorsController],
  providers: [CompetitorsService, CompetitorsRepository],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
