import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findForUser(userId: string, offset: number, limit: number, unreadOnly: boolean): Promise<[unknown[], number]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (unreadOnly) where.read = false;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return [notifications, total];
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { user_id: userId, read: false } });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true, read_at: new Date() } });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { user_id: userId, read: false }, data: { read: true, read_at: new Date() } });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async create(data: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    read: boolean;
  }) {
    return this.prisma.notification.create({ data: data as any });
  }

  async findPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({ where: { user_id: userId } });
  }

  async findPreferenceForEvent(userId: string, eventType: string) {
    return this.prisma.notificationPreference.findFirst({ where: { user_id: userId, event_type: eventType } });
  }

  async upsertPreference(userId: string, eventType: string, channel: string, enabled: boolean) {
    return this.prisma.notificationPreference.upsert({
      where: { user_id_event_type_channel: { user_id: userId, event_type: eventType, channel } },
      update: { enabled },
      create: { user_id: userId, event_type: eventType, channel, enabled },
    });
  }
}
