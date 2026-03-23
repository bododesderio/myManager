import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly repository: UsersRepository) {}

  async getProfile(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const { password_hash: _password_hash, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, data: { name?: string; avatar_url?: string }) {
    return this.repository.updateUser(userId, data);
  }

  async getPreferences(userId: string) {
    const prefs = await this.repository.findPreferences(userId);
    if (!prefs) throw new NotFoundException('Preferences not found');
    return this.sanitizePreferences(prefs);
  }

  async updatePreferences(userId: string, data: {
    language?: string;
    currency?: string;
    timezone?: string;
    theme?: string;
  }) {
    return this.repository.updatePreferences(userId, data);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password_hash || '');
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await this.repository.updateUser(userId, { password_hash: hashedPassword });
    return { message: 'Password changed successfully' };
  }

  async requestAccountDeletion(userId: string) {
    await this.repository.createDeletionRequest(userId);
    return { message: 'Account deletion request submitted. Your data will be deleted within 30 days.' };
  }

  async requestDataExport(userId: string) {
    await this.repository.createDataExportRequest(userId);
    return { message: 'Data export request submitted. You will receive an email when your data is ready for download.' };
  }

  async getPushTokens(userId: string) {
    return this.repository.findPushTokens(userId);
  }

  async registerPushToken(userId: string, data: { token: string; platform: string; deviceName?: string }) {
    return this.repository.upsertPushToken(userId, data);
  }

  async removePushToken(userId: string, token: string) {
    await this.repository.deletePushToken(userId, token);
    return { message: 'Push token removed' };
  }

  async listUsers(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    const [users, total] = await this.repository.findAllUsers(offset, limit, search);
    return {
      users: users.map((user: any) => this.summarizeAdminUser(user)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.repository.findByIdWithDetails(id);
    if (!user) throw new NotFoundException('User not found');
    return this.buildAdminUserDetail(user);
  }

  async updateUserRole(id: string, isSuperadmin: boolean) {
    await this.ensureUserExists(id);
    return this.repository.updateUser(id, { is_superadmin: isSuperadmin });
  }

  async suspendUser(id: string, suspended: boolean) {
    await this.ensureUserExists(id);
    return this.repository.updateUser(id, { is_suspended: suspended });
  }

  async disableUserTwoFactor(id: string) {
    const user = await this.repository.findByIdWithDetails(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.preferences?.totp_enabled && !user.preferences?.totp_secret) {
      return { disabled: false };
    }

    await this.repository.disableTwoFactor(id);
    return { disabled: true };
  }

  private async ensureUserExists(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private sanitizePreferences(preferences: Record<string, any>) {
    const { totp_secret: _totp_secret, ...safePreferences } = preferences;
    return safePreferences;
  }

  private summarizeAdminUser(user: Record<string, any>) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: 'Free',
      suspended: user.is_suspended,
      is_superadmin: user.is_superadmin,
      createdAt: user.created_at,
    };
  }

  private buildAdminUserDetail(user: Record<string, any>) {
    const activeSubscription = (user.subscriptions as Array<Record<string, any>> | undefined)?.find((subscription: Record<string, any>) =>
      ['ACTIVE', 'CANCELLING'].includes(subscription.status),
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      suspended: user.is_suspended,
      is_superadmin: user.is_superadmin,
      createdAt: user.created_at,
      plan: activeSubscription?.plan?.name ?? 'Free',
      twoFactorEnabled: user.preferences?.totp_enabled ?? false,
      usage: {
        socialAccounts: 0,
        postsThisMonth: 0,
        storageUsedGb: 0,
        teamMembers: user.workspace_members?.length ?? 0,
      },
      limits: {
        socialAccounts: null,
        storageGb: null,
      },
      workspaces: ((user.workspace_members ?? []) as Array<Record<string, any>>).map((member: Record<string, any>) => ({
        id: member.workspace.id,
        name: member.workspace.name,
        role: member.role,
      })),
    };
  }
}
