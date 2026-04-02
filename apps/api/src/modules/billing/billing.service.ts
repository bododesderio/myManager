import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BillingRepository } from './billing.repository';

@Injectable()
export class BillingService {
  private readonly flutterwaveSecret: string;
  private readonly flutterwaveWebhookSecret: string;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';
  private readonly logger = new Logger(BillingService.name);
  private readonly billingConfigured: boolean;

  constructor(
    private readonly repository: BillingRepository,
    private readonly configService: ConfigService,
  ) {
    this.flutterwaveSecret = this.configService.get('FLUTTERWAVE_SECRET_KEY', '');
    this.flutterwaveWebhookSecret = this.configService.get('FLUTTERWAVE_WEBHOOK_SECRET', '');
    this.billingConfigured = !!this.flutterwaveSecret;
    if (!this.billingConfigured) {
      this.logger.warn('FLUTTERWAVE_SECRET_KEY not set — billing features are disabled');
    }
    if (this.billingConfigured && !this.flutterwaveWebhookSecret) {
      throw new Error('FLUTTERWAVE_WEBHOOK_SECRET must be set when billing is enabled');
    }
  }

  private ensureBillingConfigured(): void {
    if (!this.billingConfigured) {
      throw new BadRequestException('Billing is not configured. Set FLUTTERWAVE_SECRET_KEY to enable payments.');
    }
  }

  async getSubscription(userId: string) {
    const subscription = await this.repository.findActiveSubscription(userId);
    if (!subscription) {
      const freePlan = await this.repository.findPlanBySlug('free');
      return { plan: freePlan, status: 'free', subscription: null };
    }
    return subscription;
  }

  async initializeSubscription(userId: string, data: {
    planId: string;
    interval: 'monthly' | 'yearly';
    currency: string;
    workspaceId: string;
  }) {
    this.ensureBillingConfigured();

    const plan = await this.repository.findPlanById(data.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const user = await this.repository.findUserById(userId);
    const amount = data.interval === 'yearly' ? Number(plan.price_annual_usd) : Number(plan.price_monthly_usd);

    if (data.currency !== 'USD') {
      const rate = await this.repository.getExchangeRate(data.currency);
      const localAmount = Number((amount * rate).toFixed(2));

      const response = await axios.post(`${this.baseUrl}/payments`, {
        tx_ref: `sub_${userId}_${Date.now()}`,
        amount: localAmount,
        currency: data.currency,
        payment_plan: null,
        redirect_url: `${this.configService.get('NEXTAUTH_URL')}/settings/billing?status=complete`,
        customer: { email: user!.email, name: user!.name },
        meta: { userId, planId: data.planId, interval: data.interval, workspaceId: data.workspaceId },
        customizations: { title: `${plan.name} Plan Subscription` },
      }, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });

      return { paymentLink: response.data.data.link };
    }

    const response = await axios.post(`${this.baseUrl}/payments`, {
      tx_ref: `sub_${userId}_${Date.now()}`,
      amount,
      currency: 'USD',
      redirect_url: `${this.configService.get('NEXTAUTH_URL')}/settings/billing?status=complete`,
      customer: { email: user!.email, name: user!.name },
      meta: { userId, planId: data.planId, interval: data.interval, workspaceId: data.workspaceId },
      customizations: { title: `${plan.name} Plan Subscription` },
    }, {
      headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
    });

    return { paymentLink: response.data.data.link };
  }

  async changePlan(userId: string, newPlanId: string) {
    const currentSub = await this.repository.findActiveSubscription(userId);
    const newPlan = await this.repository.findPlanById(newPlanId);
    if (!newPlan) throw new NotFoundException('Plan not found');

    if (currentSub) {
      await this.repository.updateSubscription(currentSub.id, {
        plan_id: newPlanId,
        locked_limits: newPlan.limits as any,
        locked_features: newPlan.features as any,
      });
    }

    return { message: 'Plan changed successfully', plan: newPlan };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.repository.findActiveSubscription(userId);
    if (!subscription) throw new BadRequestException('No active subscription');

    await this.repository.updateSubscription(subscription.id, {
      cancel_at_period_end: true,
      status: 'CANCELLING',
    });

    return { message: 'Subscription will be cancelled at the end of the billing period' };
  }

  async reactivateSubscription(userId: string) {
    const subscription = await this.repository.findCancellingSubscription(userId);
    if (!subscription) throw new BadRequestException('No subscription to reactivate');

    await this.repository.updateSubscription(subscription.id, {
      cancel_at_period_end: false,
      status: 'ACTIVE',
    });

    return { message: 'Subscription reactivated' };
  }

  async getBillingHistory(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [history, total] = await this.repository.findBillingHistory(userId, offset, limit);
    return {
      data: history,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getInvoice(id: string) {
    const invoice = await this.repository.findInvoice(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async verifyPayment(userId: string, data: {
    transaction_id: number;
    tx_ref?: string;
    plan?: string;
    billing_cycle?: 'monthly' | 'annual';
  }) {
    this.ensureBillingConfigured();

    const response = await axios.get(
      `${this.baseUrl}/transactions/${data.transaction_id}/verify`,
      {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      },
    );

    const verified = response.data?.data;
    if (!verified || verified.status !== 'successful') {
      throw new BadRequestException('Payment has not been completed successfully');
    }

    const existing = verified.flw_ref
      ? await this.repository.findBillingRecordByFlutterwaveRef(verified.flw_ref)
      : null;
    if (existing) {
      return { message: 'Payment already verified', billingRecordId: existing.id };
    }

    const planSlug = data.plan || verified.meta?.plan;
    const plan = planSlug
      ? await this.repository.findPlanBySlug(planSlug)
      : null;
    if (!plan) {
      throw new NotFoundException('Plan not found for verified payment');
    }

    const workspaceId =
      verified.meta?.workspaceId ||
      await this.repository.findPrimaryWorkspaceForUser(userId);
    if (!workspaceId) {
      throw new NotFoundException('Workspace not found for payment verification');
    }

    await this.repository.createSubscription({
      user_id: userId,
      workspace_id: workspaceId,
      plan_id: plan.id,
      status: 'ACTIVE',
      flutterwave_subscription_id: String(verified.id ?? data.transaction_id),
      billing_cycle:
        (data.billing_cycle || verified.meta?.billing_cycle) === 'annual'
          ? 'ANNUAL'
          : 'MONTHLY',
      locked_limits: plan.limits as Record<string, any>,
      locked_features: plan.features as Record<string, any>,
      current_period_start: new Date(),
      current_period_end: this.calculatePeriodEnd(
        data.billing_cycle || verified.meta?.billing_cycle || 'monthly',
      ),
    });

    const billingRecord = await this.repository.createBillingRecord({
      workspace_id: workspaceId,
      user_id: userId,
      plan_name: plan.name,
      amount: Number(verified.amount ?? 0),
      currency: String(verified.currency ?? 'USD'),
      status: 'PAID',
      flutterwave_ref: String(verified.flw_ref ?? data.tx_ref ?? ''),
    });

    return {
      message: 'Payment verified successfully',
      billingRecordId: billingRecord.id,
      plan: { id: plan.id, slug: plan.slug, name: plan.name },
    };
  }

  async handleWebhook(body: Record<string, any>) {
    this.ensureBillingConfigured();

    const event = body.event;
    const data = body.data;

    switch (event) {
      case 'charge.completed':
        await this.handleChargeCompleted(data);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(data);
        break;
    }

    return { status: 'ok' };
  }

  async addSeat(userId: string) {
    const subscription = await this.repository.findActiveSubscription(userId);
    if (!subscription) throw new BadRequestException('No active subscription');

    const seatCount = await this.repository.getSeatCount(subscription.id);
    await this.repository.addSubscriptionItem(subscription.id, 'seat', seatCount + 1);
    return { message: 'Seat added', totalSeats: seatCount + 1 };
  }

  async removeSeat(userId: string) {
    const subscription = await this.repository.findActiveSubscription(userId);
    if (!subscription) throw new BadRequestException('No active subscription');

    const seatCount = await this.repository.getSeatCount(subscription.id);
    const limits = (subscription as any).plan?.limits ?? null;
    const minSeats = (limits?.seats ?? 1) as number;
    if (seatCount <= minSeats) {
      throw new BadRequestException('Cannot remove seats below plan minimum');
    }

    await this.repository.removeSubscriptionItem(subscription.id, 'seat');
    return { message: 'Seat removed', totalSeats: seatCount - 1 };
  }

  async getAdminMetrics() {
    const [mrr, totalSubs, planBreakdown] = await Promise.all([
      this.repository.calculateMRR(),
      this.repository.countActiveSubscriptions(),
      this.repository.getPlanBreakdown(),
    ]);

    return { mrr, totalActiveSubscriptions: totalSubs, planBreakdown };
  }

  async createPlanOverride(adminId: string, data: {
    userId: string;
    planId: string;
    overrideUntil?: string;
    reason: string;
  }) {
    return this.repository.createOverride({
      user_id: data.userId,
      plan_id: data.planId,
      admin_id: adminId,
      override_until: data.overrideUntil ? new Date(data.overrideUntil) : null,
      reason: data.reason,
    });
  }

  async getMrrHistory(months: number) {
    const history = await this.repository.getMrrHistory(months);
    return { data: history };
  }

  async getPlanDistribution() {
    const [breakdown, plans] = await Promise.all([
      this.repository.getPlanBreakdown(),
      this.repository.getAllPlans(),
    ]);

    const distribution = breakdown.map((entry: any) => {
      const plan = plans.find((p) => p.id === entry.plan_id);
      return {
        planId: entry.plan_id,
        planName: plan?.name ?? 'Unknown',
        planSlug: plan?.slug ?? 'unknown',
        count: entry._count.id,
      };
    });

    return { data: distribution };
  }

  async getFailedPayments(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [records, total] = await this.repository.findFailedPayments(offset, limit);
    return {
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async handleChargeCompleted(data: Record<string, any>) {
    const meta = data.meta;
    if (!meta?.userId || !meta?.planId) return;

    const plan = await this.repository.findPlanById(meta.planId);
    if (!plan) return;

    await this.repository.createSubscription({
      user_id: meta.userId,
      workspace_id: meta.workspaceId,
      plan_id: meta.planId,
      status: 'ACTIVE',
      flutterwave_subscription_id: data.id?.toString() ?? '',
      billing_cycle: meta.interval === 'yearly' ? 'ANNUAL' : 'MONTHLY',
      locked_limits: plan.limits as Record<string, any>,
      locked_features: plan.features as Record<string, any>,
      current_period_start: new Date(),
      current_period_end: this.calculatePeriodEnd(meta.interval),
    });

    await this.repository.createBillingRecord({
      workspace_id: meta.workspaceId,
      user_id: meta.userId,
      plan_name: plan.name,
      amount: data.amount,
      currency: data.currency,
      status: 'PAID',
      flutterwave_ref: data.flw_ref,
    });
  }

  private async handleSubscriptionCancelled(data: Record<string, any>) {
    const subscription = await this.repository.findByFlutterwaveId(data.id?.toString());
    if (subscription) {
      await this.repository.updateSubscription(subscription.id, { status: 'CANCELLED' });
    }
  }

  private async handlePaymentFailed(data: Record<string, any>) {
    const meta = data.meta;
    if (meta?.userId && meta?.workspaceId) {
      await this.repository.createBillingRecord({
        workspace_id: meta.workspaceId,
        user_id: meta.userId,
        plan_name: 'Unknown',
        amount: data.amount,
        currency: data.currency,
        status: 'FAILED',
        flutterwave_ref: data.flw_ref,
      });
    }
  }

  private calculatePeriodEnd(interval: string): Date {
    const now = new Date();
    if (interval === 'yearly' || interval === 'ANNUAL') {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
    return new Date(now.setMonth(now.getMonth() + 1));
  }
}
