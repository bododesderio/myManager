import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';

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
    ),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService],
})
export class PostsModule {}
