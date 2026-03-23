import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RealtimeModule } from '../modules/realtime/realtime.module';
import { DlqHandler } from './dlq.handler';

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
        name: `${name}-dlq`,
      })),
      { name: 'email-delivery' },
    ),
    RealtimeModule,
  ],
  providers: [DlqHandler],
  exports: [DlqHandler],
})
export class DlqModule {}
