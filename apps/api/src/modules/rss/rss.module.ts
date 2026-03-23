import { Module } from '@nestjs/common';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';
import { RssRepository } from './rss.repository';

@Module({
  controllers: [RssController],
  providers: [RssService, RssRepository],
  exports: [RssService],
})
export class RssModule {}
