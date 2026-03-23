import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithDetails(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        workspace_members: { include: { workspace: true } },
        subscriptions: { include: { plan: true } },
      },
    });
  }

  async updateUser(id: string, data: Record<string, unknown>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findPreferences(userId: string) {
    return this.prisma.userPreferences.findUnique({ where: { user_id: userId } });
  }

  async updatePreferences(userId: string, data: Record<string, unknown>) {
    return this.prisma.userPreferences.update({ where: { user_id: userId }, data });
  }

  async disableTwoFactor(userId: string) {
    await this.prisma.totpBackupCode.deleteMany({ where: { user_id: userId } });
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_enabled: false, totp_secret: null },
    });
  }

  async createDeletionRequest(userId: string) {
    return this.prisma.deletionRequest.create({
      data: {
        user_id: userId,
        status: 'pending',
        scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async createDataExportRequest(userId: string) {
    return this.prisma.dataExportRequest.create({
      data: {
        user_id: userId,
        status: 'pending',
      },
    });
  }

  async findPushTokens(userId: string) {
    return this.prisma.userPushToken.findMany({ where: { user_id: userId } });
  }

  async upsertPushToken(userId: string, data: { token: string; platform: string; deviceName?: string }) {
    return this.prisma.userPushToken.upsert({
      where: { user_id_token: { user_id: userId, token: data.token } },
      update: { platform: data.platform, device_name: data.deviceName },
      create: { user_id: userId, token: data.token, platform: data.platform, device_name: data.deviceName },
    });
  }

  async deletePushToken(userId: string, token: string) {
    return this.prisma.userPushToken.delete({
      where: { user_id_token: { user_id: userId, token } },
    });
  }

  async findAllUsers(offset: number, limit: number, search?: string): Promise<[unknown[], number]> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return [users, total];
  }
}
