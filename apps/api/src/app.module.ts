import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { WorkspaceMemberGuard } from './common/guards/workspace-member.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PostsModule } from './modules/posts/posts.module';
import { SocialAccountsModule } from './modules/social-accounts/social-accounts.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MediaModule } from './modules/media/media.module';
import { PlansModule } from './modules/plans/plans.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BrandModule } from './modules/brand/brand.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AiModule } from './modules/ai/ai.module';
import { BioPagesModule } from './modules/bio-pages/bio-pages.module';
import { CommentsModule } from './modules/comments/comments.module';
import { RssModule } from './modules/rss/rss.module';
import { ListeningModule } from './modules/listening/listening.module';
import { CompetitorsModule } from './modules/competitors/competitors.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { SalesLeadsModule } from './modules/sales-leads/sales-leads.module';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { CmsModule } from './modules/cms/cms.module';
import { BlogModule } from './modules/blog/blog.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { ContactModule } from './modules/contact/contact.module';
import { FaqModule } from './modules/faq/faq.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { ThemeModule } from './modules/theme/theme.module';
import { PortalModule } from './modules/portal/portal.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { PrismaModule } from './prisma.module';
import { DlqModule } from './workers/dlq.module';
import { HealthController } from './health.controller';
import { BrandController } from './brand.controller';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
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
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    PostsModule,
    SocialAccountsModule,
    PublishingModule,
    AnalyticsModule,
    MediaModule,
    PlansModule,
    BillingModule,
    NotificationsModule,
    ApprovalsModule,
    ReportsModule,
    BrandModule,
    TemplatesModule,
    CampaignsModule,
    AiModule,
    BioPagesModule,
    CommentsModule,
    RssModule,
    ListeningModule,
    CompetitorsModule,
    WebhooksModule,
    ApiKeysModule,
    SalesLeadsModule,
    AuditModule,
    RealtimeModule,
    CmsModule,
    BlogModule,
    NewsletterModule,
    ContactModule,
    FaqModule,
    TestimonialsModule,
    ThemeModule,
    PortalModule,
    AdminDashboardModule,
    SystemConfigModule,
    PlatformsModule,
    ExchangeRatesModule,
    DlqModule,
  ],
  controllers: [HealthController, BrandController, MetricsController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: WorkspaceMemberGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
