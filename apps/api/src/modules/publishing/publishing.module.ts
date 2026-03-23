import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { PublishingRepository } from './publishing.repository';

const PUBLISHING_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: true,
  removeOnFail: false,
};

const PUBLISHING_QUEUE_NAMES = [
  'publishing-facebook',
  'publishing-instagram',
  'publishing-x',
  'publishing-linkedin',
  'publishing-tiktok',
  'publishing-google-business',
  'publishing-pinterest',
  'publishing-youtube',
  'publishing-whatsapp',
  'publishing-threads',
];

@Module({
  imports: [
    BullModule.registerQueue(
      ...PUBLISHING_QUEUE_NAMES.map((name) => ({
        name,
        defaultJobOptions: PUBLISHING_JOB_OPTIONS,
      })),
      ...PUBLISHING_QUEUE_NAMES.map((name) => ({
        name: `${name}-dlq`,
      })),
    ),
  ],
  controllers: [PublishingController],
  providers: [PublishingService, PublishingRepository],
  exports: [PublishingService],
})
export class PublishingModule {}
