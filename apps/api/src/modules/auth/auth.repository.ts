import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    emailVerified?: boolean;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.passwordHash,
        name: data.name,
        email_verified: data.emailVerified ?? false,
        avatar_url: data.avatarUrl,
      },
    });
  }

  async createDefaultWorkspace(userId: string, name: string, slug?: string) {
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.workspace.create({
      data: { name, slug: finalSlug },
    });
  }

  async assignPlanToWorkspace(workspaceId: string, userId: string, planSlug: string, billingCycle: string) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) return;

    return this.prisma.subscription.create({
      data: {
        workspace_id: workspaceId,
        user_id: userId,
        plan_id: plan.id,
        status: 'ACTIVE',
        billing_cycle: billingCycle === 'annual' ? 'ANNUAL' : 'MONTHLY',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
        locked_limits: (plan.limits as Record<string, any>) ?? {},
        locked_features: (plan.features as Record<string, any>) ?? {},
      },
    });
  }

  async createWorkspaceMember(workspaceId: string, userId: string, role: string) {
    return this.prisma.workspaceMember.create({
      data: { workspace_id: workspaceId, user_id: userId, role: role as WorkspaceRole },
    });
  }

  async createUserPreferences(userId: string) {
    return this.prisma.userPreferences.create({
      data: {
        user_id: userId,
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        theme: 'system',
      },
    });
  }

  async storeRefreshToken(userId: string, token: string, expires: Date) {
    return this.prisma.session.create({
      data: { user_id: userId, session_token: token, expires },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.session.findFirst({
      where: { session_token: token },
    });
  }

  async deleteRefreshToken(token: string) {
    return this.prisma.session.deleteMany({
      where: { session_token: token },
    });
  }

  /**
   * Atomically delete a refresh token if it exists and is unexpired.
   * Returns the deleted row, or null if nothing was deleted (race or invalid).
   */
  async deleteRefreshTokenIfValid(token: string) {
    // Atomic: deleteMany returns count; only one concurrent caller sees count===1.
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.session.findFirst({
        where: { session_token: token, expires: { gt: new Date() } },
      });
      if (!existing) return null;
      const result = await tx.session.deleteMany({
        where: { session_token: token },
      });
      return result.count === 1 ? existing : null;
    });
  }

  async deleteAllRefreshTokensForUser(userId: string) {
    return this.prisma.session.deleteMany({
      where: { user_id: userId },
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
      },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { email_verified: true },
    });
  }

  async storeTotpSecret(userId: string, encryptedSecret: string) {
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_secret: encryptedSecret },
    });
  }

  async storeBackupCodes(userId: string, hashedCodes: string[]) {
    await this.prisma.totpBackupCode.deleteMany({ where: { user_id: userId } });
    return this.prisma.totpBackupCode.createMany({
      data: hashedCodes.map((code) => ({
        user_id: userId,
        code_hash: code,
        used: false,
      })),
    });
  }

  async enableTwoFactor(userId: string) {
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_enabled: true },
    });
  }

  async disableTwoFactor(userId: string) {
    await this.prisma.totpBackupCode.deleteMany({ where: { user_id: userId } });
    return this.prisma.userPreferences.update({
      where: { user_id: userId },
      data: { totp_enabled: false, totp_secret: null },
    });
  }

  async upsertOAuthAccount(userId: string, provider: string, providerAccountId: string, tokenData: Record<string, any>) {
    return this.prisma.account.upsert({
      where: {
        provider_provider_account_id: { provider, provider_account_id: providerAccountId },
      },
      update: {
        access_token: tokenData.access_token || tokenData.idToken,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      },
      create: {
        user_id: userId,
        provider,
        provider_account_id: providerAccountId,
        type: 'oauth',
        access_token: tokenData.access_token || tokenData.idToken,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      },
    });
  }

  async storePasswordResetToken(userId: string, hashedToken: string, expiresAt: Date) {
    // Delete any existing tokens for this user
    await this.prisma.$executeRaw`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
    await this.prisma.$executeRaw`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (gen_random_uuid(), ${userId}, ${hashedToken}, ${expiresAt}, NOW())`;
  }

  async findPasswordResetToken(hashedToken: string) {
    const results = await this.prisma.$queryRaw<Array<{ id: string; user_id: string; token_hash: string; expires_at: Date; used_at: Date | null }>>`SELECT * FROM password_reset_tokens WHERE token_hash = ${hashedToken} LIMIT 1`;
    return results[0] || null;
  }

  async markPasswordResetTokenUsed(id: string) {
    await this.prisma.$executeRaw`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${id}`;
  }

  async storeEmailVerificationToken(userId: string, hashedToken: string, expiresAt: Date) {
    await this.prisma.$executeRaw`DELETE FROM email_verification_tokens WHERE user_id = ${userId}`;
    await this.prisma.$executeRaw`INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (gen_random_uuid(), ${userId}, ${hashedToken}, ${expiresAt}, NOW())`;
  }

  async findEmailVerificationToken(hashedToken: string) {
    const results = await this.prisma.$queryRaw<Array<{ id: string; user_id: string; token_hash: string; expires_at: Date; used_at: Date | null }>>`SELECT * FROM email_verification_tokens WHERE token_hash = ${hashedToken} LIMIT 1`;
    return results[0] || null;
  }

  async markEmailVerificationTokenUsed(id: string) {
    await this.prisma.$executeRaw`UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ${id}`;
  }

  async findActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { user_id: userId, status: { in: ['ACTIVE', 'CANCELLING'] } },
      include: { plan: true },
    });
  }

  async findWorkspaceBySlug(slug: string) {
    return this.prisma.workspace.findUnique({ where: { slug } });
  }

  async enqueueEmail(template: string, data: Record<string, any>) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && data.email) {
      const resend = new Resend(resendApiKey);
      const subjectMap: Record<string, string> = {
        'verify-email': 'Verify your email address',
        'password-reset': 'Reset your password',
      };

      const verifyUrl = data.verifyUrl as string | undefined;
      const resetUrl = data.resetUrl as string | undefined;
      const htmlMap: Record<string, string | undefined> = {
        'verify-email': verifyUrl
          ? `<p>Hi ${data.name || 'there'},</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p>`
          : undefined,
        'password-reset': resetUrl
          ? `<p>Hi ${data.name || 'there'},</p><p>You requested a password reset. Click the link below to choose a new password:</p><p><a href="${resetUrl}">Reset Password</a></p>`
          : undefined,
      };

      const subject = subjectMap[template];
      const html = htmlMap[template];

      if (subject && html) {
        await resend.emails.send({
          from: `${process.env.BRAND_NAME || 'MyManager'} <noreply@${process.env.EMAIL_DOMAIN || 'mymanager.com'}>`,
          to: data.email,
          subject,
          html,
        });
      }
    }

    return this.prisma.notification.create({
      data: {
        user_id: data.to,
        type: 'email',
        title: template,
        body: JSON.stringify(data),
        read: false,
      },
    });
  }
}
