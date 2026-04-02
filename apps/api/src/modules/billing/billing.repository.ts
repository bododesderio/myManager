import { Injectable } from '@nestjs/common';
import { SubStatus, BillingCycle } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { user_id: userId, status: { in: ['ACTIVE', 'CANCELLING'] } },
      include: { plan: true },
    });
  }

  async findCancellingSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { user_id: userId, status: 'CANCELLING' },
      include: { plan: true },
    });
  }

  async findByFlutterwaveId(flutterwaveSubscriptionId: string) {
    return this.prisma.subscription.findFirst({
      where: { flutterwave_subscription_id: flutterwaveSubscriptionId },
    });
  }

  async findPlanById(id: string) {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async findPlanBySlug(slug: string) {
    return this.prisma.plan.findUnique({ where: { slug } });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  }

  async findPrimaryWorkspaceForUser(userId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { user_id: userId },
      orderBy: { joined_at: 'asc' },
      select: { workspace_id: true },
    });

    return membership?.workspace_id ?? null;
  }

  async findBillingRecordByFlutterwaveRef(flutterwaveRef: string) {
    return this.prisma.billingHistory.findFirst({
      where: { flutterwave_ref: flutterwaveRef },
      orderBy: { created_at: 'desc' },
    });
  }

  async createSubscription(data: {
    user_id: string;
    workspace_id: string;
    plan_id: string;
    status: string;
    flutterwave_subscription_id: string;
    billing_cycle: string;
    locked_limits: Record<string, any>;
    locked_features: Record<string, any>;
    current_period_start: Date;
    current_period_end: Date;
  }) {
    await this.prisma.subscription.updateMany({
      where: { user_id: data.user_id, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' as SubStatus },
    });

    return this.prisma.subscription.create({
      data: {
        ...data,
        status: data.status as SubStatus,
        billing_cycle: data.billing_cycle as BillingCycle,
      },
    });
  }

  async updateSubscription(id: string, data: Record<string, any>) {
    return this.prisma.subscription.update({ where: { id }, data });
  }

  async createBillingRecord(data: {
    workspace_id: string;
    user_id: string;
    plan_name: string;
    amount: number;
    currency: string;
    status: string;
    flutterwave_ref: string;
  }) {
    return this.prisma.billingHistory.create({ data });
  }

  async findBillingHistory(userId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const [records, total] = await Promise.all([
      this.prisma.billingHistory.findMany({
        where: { user_id: userId },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.billingHistory.count({ where: { user_id: userId } }),
    ]);
    return [records, total];
  }

  async findInvoice(id: string) {
    return this.prisma.billingHistory.findUnique({ where: { id } });
  }

  async getSeatCount(subscriptionId: string): Promise<number> {
    return this.prisma.subscriptionItem.count({
      where: { subscription_id: subscriptionId, type: 'seat' },
    });
  }

  async addSubscriptionItem(subscriptionId: string, type: string, quantity: number) {
    return this.prisma.subscriptionItem.create({
      data: { subscription_id: subscriptionId, type, quantity, unit_price: 0 },
    });
  }

  async removeSubscriptionItem(subscriptionId: string, type: string) {
    const item = await this.prisma.subscriptionItem.findFirst({
      where: { subscription_id: subscriptionId, type },
      orderBy: { created_at: 'desc' },
    });
    if (item) {
      await this.prisma.subscriptionItem.delete({ where: { id: item.id } });
    }
  }

  async calculateMRR(): Promise<number> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    return subscriptions.reduce((mrr, sub) => {
      const monthlyAmount = sub.billing_cycle === 'ANNUAL'
        ? Number(sub.plan.price_annual_usd) / 12
        : Number(sub.plan.price_monthly_usd);
      return mrr + monthlyAmount;
    }, 0);
  }

  async countActiveSubscriptions(): Promise<number> {
    return this.prisma.subscription.count({ where: { status: 'ACTIVE' } });
  }

  async getPlanBreakdown() {
    return this.prisma.subscription.groupBy({
      by: ['plan_id'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });
  }

  async createOverride(data: {
    user_id: string;
    plan_id: string;
    admin_id: string;
    override_until: Date | null;
    reason: string;
  }) {
    return this.prisma.planOverride.create({ data });
  }

  async getAllPlans() {
    return this.prisma.plan.findMany();
  }

  async getMrrHistory(months: number) {
    const results: { month: string; mrr: number; subscriptionCount: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          created_at: { lte: endDate },
        },
        include: { plan: true },
      });

      const mrr = subscriptions.reduce((acc, sub) => {
        const monthlyAmount = sub.billing_cycle === 'ANNUAL'
          ? Number(sub.plan.price_annual_usd) / 12
          : Number(sub.plan.price_monthly_usd);
        return acc + monthlyAmount;
      }, 0);

      results.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        mrr: Math.round(mrr * 100) / 100,
        subscriptionCount: subscriptions.length,
      });
    }

    return results;
  }

  async findFailedPayments(offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { status: 'FAILED' };
    const [records, total] = await Promise.all([
      this.prisma.billingHistory.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.billingHistory.count({ where }),
    ]);
    return [records, total];
  }

  async getExchangeRate(currency: string): Promise<number> {
    const cached = await redis.get(`exchange_rate:${currency}`);
    if (cached) return Number(cached);

    const rate = await this.prisma.exchangeRate.findFirst({
      where: { to_currency: currency },
      orderBy: { fetched_at: 'desc' },
    });
    return rate?.rate ?? 1;
  }
}
