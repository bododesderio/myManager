import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MediaModule } from './modules/media/media.module';
import { RssModule } from './modules/rss/rss.module';
import { SocialAccountsModule } from './modules/social-accounts/social-accounts.module';
import { CompetitorsModule } from './modules/competitors/competitors.module';
import { PostsModule } from './modules/posts/posts.module';
import { BillingModule } from './modules/billing/billing.module';
import { PlansModule } from './modules/plans/plans.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { DlqModule } from './workers/dlq.module';
import { AnalyticsSyncCron } from './crons/analytics-sync.cron';
import { BestTimesCron } from './crons/best-times.cron';
import { CompetitorSyncCron } from './crons/competitor-sync.cron';
import { DataDeletionCron } from './crons/data-deletion.cron';
import { ExchangeRatesCron } from './crons/exchange-rates.cron';
import { MonthlyReportsCron } from './crons/monthly-reports.cron';
import { ScheduledPostsCron } from './crons/scheduled-posts.cron';
import { TokenRefreshCron } from './crons/token-refresh.cron';
import { ListeningSyncCron } from './crons/listening-sync.cron';
import {
  FacebookProcessor,
  InstagramProcessor,
  XProcessor,
  LinkedInProcessor,
  TikTokProcessor,
  GoogleBusinessProcessor,
  PinterestProcessor,
  YouTubeProcessor,
  WhatsAppProcessor,
  ThreadsProcessor,
  AnalyticsSyncProcessor,
  TokenRefreshProcessor,
  ReportGenerationProcessor,
  EmailDeliveryProcessor,
  PushNotificationProcessor,
  WebhookDeliveryProcessor,
  MediaProcessingProcessor,
} from './workers/publishing.processors';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379');
        try {
          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: parseInt(url.port) || 6379,
              password: url.password || undefined,
              retryStrategy: (times: number) => Math.min(times * 5000, 30000),
            },
          };
        } catch {
          return {
            redis: {
              host: 'localhost',
              port: 6379,
              retryStrategy: (times: number) => Math.min(times * 5000, 30000),
            },
          };
        }
      },
    }),
    BullModule.registerQueue(
      { name: 'analytics-sync' },
      { name: 'report-generation' },
      { name: 'token-refresh' },
      { name: 'email-delivery' },
      { name: 'push-notifications' },
      { name: 'webhook-delivery' },
      { name: 'media-processing' },
      { name: 'publishing-facebook' },
      { name: 'publishing-instagram' },
      { name: 'publishing-x' },
      { name: 'publishing-linkedin' },
      { name: 'publishing-tiktok' },
      { name: 'publishing-google-business' },
      { name: 'publishing-pinterest' },
      { name: 'publishing-youtube' },
      { name: 'publishing-whatsapp' },
      { name: 'publishing-threads' },
    ),
    PrismaModule,
    PublishingModule,
    NotificationsModule,
    WebhooksModule,
    AnalyticsModule,
    ReportsModule,
    MediaModule,
    RssModule,
    SocialAccountsModule,
    CompetitorsModule,
    PostsModule,
    BillingModule,
    PlansModule,
    ExchangeRatesModule,
    DlqModule,
  ],
  providers: [
    AnalyticsSyncCron,
    BestTimesCron,
    CompetitorSyncCron,
    DataDeletionCron,
    ExchangeRatesCron,
    MonthlyReportsCron,
    ScheduledPostsCron,
    TokenRefreshCron,
    ListeningSyncCron,
    FacebookProcessor,
    InstagramProcessor,
    XProcessor,
    LinkedInProcessor,
    TikTokProcessor,
    GoogleBusinessProcessor,
    PinterestProcessor,
    YouTubeProcessor,
    WhatsAppProcessor,
    ThreadsProcessor,
    AnalyticsSyncProcessor,
    TokenRefreshProcessor,
    ReportGenerationProcessor,
    EmailDeliveryProcessor,
    PushNotificationProcessor,
    WebhookDeliveryProcessor,
    MediaProcessingProcessor,
  ],
})
export class WorkerModule {}
