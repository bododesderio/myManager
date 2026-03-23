import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailConfigured: boolean;

  constructor(
    private readonly repository: NotificationsRepository,
    @InjectQueue('email-delivery') private emailQueue: Queue,
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {
    this.emailConfigured = !!process.env.RESEND_API_KEY;
    if (!this.emailConfigured) {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged to console instead of sent');
    }
  }

  async listForUser(userId: string, page: number, limit: number, unreadOnly: boolean) {
    const offset = (page - 1) * limit;
    const [notifications, total] = await this.repository.findForUser(userId, offset, limit, unreadOnly);
    return {
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.repository.countUnread(userId);
    return { unreadCount: count };
  }

  async markAsRead(id: string) {
    await this.repository.markRead(id);
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllRead(userId);
    return { message: 'All notifications marked as read' };
  }

  async delete(id: string) {
    await this.repository.delete(id);
    return { message: 'Notification deleted' };
  }

  async getPreferences(userId: string) {
    return this.repository.findPreferences(userId);
  }

  async updatePreferences(userId: string, eventType: string, channel: string, enabled: boolean) {
    return this.repository.upsertPreference(userId, eventType, channel, enabled);
  }

  async notify(userId: string, type: string, data: Record<string, unknown>) {
    const preferences = await this.repository.findPreferenceForEvent(userId, type);

    const notification = await this.repository.create({
      user_id: userId,
      type,
      title: this.getNotificationTitle(type, data),
      body: this.getNotificationBody(type, data),
      data,
      read: false,
    });

    if (!preferences || preferences.enabled !== false) {
      if (this.emailConfigured) {
        await this.emailQueue.add('send', {
          userId,
          template: type,
          data,
        }, { attempts: 3, backoff: { type: 'fixed', delay: 300000 } });
      } else {
        this.logger.log(`[EMAIL-LOG] To: ${userId} | Template: ${type} | Data: ${JSON.stringify(data)}`);
      }
    }

    if (!preferences || preferences.enabled !== false) {
      await this.pushQueue.add('send', {
        userId,
        title: notification.title,
        body: notification.body,
        data: { type, ...data },
      }, { attempts: 3, backoff: { type: 'fixed', delay: 60000 } });
    }

    return notification;
  }

  private getNotificationTitle(type: string, _data: Record<string, unknown>): string {
    const titles: Record<string, string> = {
      post_published: 'Post Published',
      post_failed: 'Post Failed',
      post_scheduled: 'Post Scheduled',
      approval_needed: 'Approval Required',
      approval_approved: 'Post Approved',
      approval_rejected: 'Revision Requested',
      team_invite: 'Team Invitation',
      payment_received: 'Payment Received',
      payment_failed: 'Payment Failed',
      token_expired: 'Social Account Token Expired',
      report_ready: 'Report Ready',
      comment_received: 'New Comment',
    };
    return titles[type] || 'Notification';
  }

  private getNotificationBody(type: string, data: Record<string, unknown>): string {
    switch (type) {
      case 'post_published':
        return `Your post was published to ${data.platform}`;
      case 'post_failed':
        return `Failed to publish to ${data.platform}: ${data.reason}`;
      case 'approval_needed':
        return `A post needs your approval`;
      case 'token_expired':
        return `Your ${data.platform} connection needs to be reauthorized`;
      case 'report_ready':
        return `Your report "${data.reportName}" is ready for download`;
      default:
        return JSON.stringify(data);
    }
  }
}
