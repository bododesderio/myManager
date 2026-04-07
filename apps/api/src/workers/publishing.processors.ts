import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { FacebookWorker } from './platforms/facebook.worker';
import { InstagramWorker } from './platforms/instagram.worker';
import { XWorker } from './platforms/x.worker';
import { LinkedInWorker } from './platforms/linkedin.worker';
import { TikTokWorker } from './platforms/tiktok.worker';
import { GoogleBusinessWorker } from './platforms/google-business.worker';
import { PinterestWorker } from './platforms/pinterest.worker';
import { YouTubeWorker } from './platforms/youtube.worker';
import { WhatsAppWorker } from './platforms/whatsapp.worker';
import { ThreadsWorker } from './platforms/threads.worker';
import { AnalyticsSyncWorker } from './analytics-sync.worker';
import { TokenRefreshWorker } from './token-refresh.worker';
import { ReportGeneratorWorker } from './report-generator.worker';
import { EmailWorker } from './email.worker';
import { NotificationWorker } from './notification.worker';
import { WebhookDeliveryWorker } from './webhook-delivery.worker';
import { MediaProcessorWorker } from './media-processor.worker';
import type { PublishJobData } from './platforms/base.worker';

@Processor('publishing-facebook')
export class FacebookProcessor {
  private readonly worker: FacebookWorker;
  constructor(prisma: PrismaService) {
    this.worker = new FacebookWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-instagram')
export class InstagramProcessor {
  private readonly worker: InstagramWorker;
  constructor(prisma: PrismaService) {
    this.worker = new InstagramWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-x')
export class XProcessor {
  private readonly worker: XWorker;
  constructor(prisma: PrismaService) {
    this.worker = new XWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-linkedin')
export class LinkedInProcessor {
  private readonly worker: LinkedInWorker;
  constructor(prisma: PrismaService) {
    this.worker = new LinkedInWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-tiktok')
export class TikTokProcessor {
  private readonly worker: TikTokWorker;
  constructor(prisma: PrismaService) {
    this.worker = new TikTokWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-google-business')
export class GoogleBusinessProcessor {
  private readonly worker: GoogleBusinessWorker;
  constructor(prisma: PrismaService) {
    this.worker = new GoogleBusinessWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-pinterest')
export class PinterestProcessor {
  private readonly worker: PinterestWorker;
  constructor(prisma: PrismaService) {
    this.worker = new PinterestWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-youtube')
export class YouTubeProcessor {
  private readonly worker: YouTubeWorker;
  constructor(prisma: PrismaService) {
    this.worker = new YouTubeWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-whatsapp')
export class WhatsAppProcessor {
  private readonly worker: WhatsAppWorker;
  constructor(prisma: PrismaService) {
    this.worker = new WhatsAppWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('publishing-threads')
export class ThreadsProcessor {
  private readonly worker: ThreadsWorker;
  constructor(prisma: PrismaService) {
    this.worker = new ThreadsWorker(prisma);
  }
  @Process('publish')
  handle(job: Job<PublishJobData>) {
    return this.worker.process(job);
  }
}

@Processor('analytics-sync')
@Injectable()
export class AnalyticsSyncProcessor {
  private readonly worker: AnalyticsSyncWorker;
  constructor(prisma: PrismaService) {
    this.worker = new AnalyticsSyncWorker(prisma);
  }
  @Process('sync')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}

@Processor('token-refresh')
@Injectable()
export class TokenRefreshProcessor {
  private readonly worker: TokenRefreshWorker;
  constructor(prisma: PrismaService) {
    this.worker = new TokenRefreshWorker(prisma);
  }
  @Process('refresh')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}

@Processor('report-generation')
@Injectable()
export class ReportGenerationProcessor {
  private readonly worker: ReportGeneratorWorker;
  constructor(prisma: PrismaService) {
    this.worker = new ReportGeneratorWorker(prisma);
  }
  @Process('generate')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}

@Processor('email-delivery')
@Injectable()
export class EmailDeliveryProcessor {
  private readonly worker = new EmailWorker();
  @Process('send')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}

@Processor('push-notifications')
@Injectable()
export class PushNotificationProcessor {
  private readonly worker: NotificationWorker;
  constructor(prisma: PrismaService) {
    this.worker = new NotificationWorker(prisma);
  }
  @Process('send')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}

@Processor('webhook-delivery')
@Injectable()
export class WebhookDeliveryProcessor {
  private readonly worker: WebhookDeliveryWorker;
  constructor(prisma: PrismaService) {
    this.worker = new WebhookDeliveryWorker(prisma);
  }
  @Process('deliver')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}

@Processor('media-processing')
@Injectable()
export class MediaProcessingProcessor {
  private readonly worker: MediaProcessorWorker;
  constructor(prisma: PrismaService) {
    this.worker = new MediaProcessorWorker(prisma);
  }
  @Process('process')
  handle(job: Job<any>) {
    return this.worker.process(job);
  }
}
