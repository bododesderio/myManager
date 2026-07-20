import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserStatus, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BillingRepository } from './billing.repository';
import { WebhooksService } from '../webhooks/webhooks.service';

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
    private readonly webhooksService: WebhooksService,
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
    // Kept as Decimal: converting to a JS number here was where an exact
    // Decimal(10,2) price silently became a float approximation.
    const amount = data.interval === 'yearly' ? plan.price_annual_usd : plan.price_monthly_usd;

    if (data.currency !== 'USD') {
      const rate = await this.repository.getExchangeRate(data.currency);
      // Decimal multiplication, rounded once at the end to the currency's
      // minor unit. toNumber() only at the wire boundary, where the value is
      // already exact at 2dp.
      const localAmount = new Prisma.Decimal(amount).mul(rate).toDecimalPlaces(2);

      const response = await axios.post(`${this.baseUrl}/payments`, {
        tx_ref: `sub_${userId}_${Date.now()}`,
        amount: localAmount.toNumber(),
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
      amount: new Prisma.Decimal(amount).toNumber(),
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

    await this.dispatchBillingEvent(subscription.workspace_id, 'billing.subscription_cancellation_scheduled', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      planId: subscription.plan_id,
      currentPeriodEnd: subscription.current_period_end.toISOString(),
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

    await this.dispatchBillingEvent(subscription.workspace_id, 'billing.subscription_reactivated', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      planId: subscription.plan_id,
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

  async getInvoice(id: string, userId: string) {
    const invoice = await this.repository.findInvoice(id, userId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /**
   * Re-fetch a transaction from Flutterwave and return the authoritative record.
   *
   * This is the compensating control for Flutterwave's static `verif-hash`
   * webhook signature, which cannot bind a signature to a payload. Anything that
   * grants entitlements must be driven by this response, never by a request body.
   *
   * Returns null on any failure — callers must treat that as "do not act".
   */
  private async fetchVerifiedTransaction(
    transactionId: string | number,
  ): Promise<Record<string, any> | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}/verify`,
        { headers: { Authorization: `Bearer ${this.flutterwaveSecret}` } },
      );
      return response.data?.data ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to re-verify Flutterwave transaction ${String(transactionId)}: ${message}`,
      );
      return null;
    }
  }

  /**
   * Assert the amount actually captured matches the plan's list price.
   *
   * Non-USD checkouts are converted at initialize time, and the FX rate can move
   * between initialize and verify, so local-currency payments are compared with a
   * small tolerance. USD is compared exactly (to the cent).
   */
  private async assertPaidAmountMatchesPlan(
    verified: { amount?: unknown; currency?: unknown },
    plan: { price_monthly_usd: Prisma.Decimal; price_annual_usd: Prisma.Decimal },
    isAnnual: boolean,
  ): Promise<void> {
    const currency = String(verified.currency ?? 'USD').toUpperCase();

    let paid: Prisma.Decimal;
    try {
      paid = new Prisma.Decimal(String(verified.amount ?? 0));
    } catch {
      throw new BadRequestException('Verified transaction has no usable amount');
    }

    if (!paid.isFinite() || paid.lte(0)) {
      throw new BadRequestException('Verified transaction has no usable amount');
    }

    const listUsd = isAnnual ? plan.price_annual_usd : plan.price_monthly_usd;

    let expected = new Prisma.Decimal(listUsd);
    // Half a cent — USD must match exactly.
    let tolerance = new Prisma.Decimal('0.005');

    if (currency !== 'USD') {
      const rate = await this.repository.getExchangeRate(currency);
      if (!rate.isFinite() || rate.lte(0)) {
        throw new BadRequestException(`No exchange rate available for ${currency}`);
      }
      expected = expected.mul(rate);
      // 2% headroom for FX drift between checkout and verification.
      tolerance = expected.mul('0.02');
    }

    if (paid.minus(expected).abs().gt(tolerance)) {
      this.logger.warn(
        `Payment amount mismatch: paid ${paid.toString()} ${currency}, expected ~${expected.toFixed(2)} ${currency}`,
      );
      throw new BadRequestException('Payment amount does not match the plan price');
    }
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

    // SECURITY: plan and cycle are derived exclusively from the server-set `meta`
    // written in initializeSubscription(). Client-supplied `data.plan` /
    // `data.billing_cycle` are IGNORED — trusting them let any user pay for the
    // cheapest plan and claim any other. `data` retains those fields only for
    // backwards-compatible request shapes.
    const meta = verified.meta ?? {};

    // The transaction must belong to the caller, or one user could redeem
    // another user's successful payment against their own subscription.
    if (meta.userId && String(meta.userId) !== String(userId)) {
      throw new ForbiddenException('This transaction belongs to a different user');
    }

    const planId = meta.planId ? String(meta.planId) : null;
    if (!planId) {
      throw new BadRequestException(
        'Payment is missing server-side plan metadata and cannot be verified',
      );
    }

    const plan = await this.repository.findPlanById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found for verified payment');
    }

    // initializeSubscription writes `interval` as 'monthly' | 'yearly'.
    const isAnnual = String(meta.interval ?? 'monthly') === 'yearly';
    const billingCycle: 'monthly' | 'annual' = isAnnual ? 'annual' : 'monthly';

    // The amount actually paid must match the plan's price. Without this, a
    // verified-but-cheaper transaction could unlock an expensive plan.
    await this.assertPaidAmountMatchesPlan(verified, plan, isAnnual);

    const workspaceId =
      meta.workspaceId ||
      await this.repository.findPrimaryWorkspaceForUser(userId);
    if (!workspaceId) {
      throw new NotFoundException('Workspace not found for payment verification');
    }

    await this.activateSubscription({
      userId,
      workspaceId,
      planId: plan.id,
      flutterwaveId: String(verified.id ?? data.transaction_id),
      billingCycle,
    });

    const billingRecord = await this.repository.createBillingRecord({
      workspace_id: workspaceId,
      user_id: userId,
      plan_name: plan.name,
      // Constructed from the string form so the ledger stores the exact captured
      // amount rather than a float approximation of it.
      amount: new Prisma.Decimal(String(verified.amount ?? 0)),
      currency: String(verified.currency ?? 'USD'),
      status: 'PAID',
      flutterwave_ref: String(verified.flw_ref ?? data.tx_ref ?? ''),
    });

    await this.syncUserStatusAfterPayment(userId);
    await this.dispatchBillingEvent(workspaceId, 'billing.payment_succeeded', {
      billingRecordId: billingRecord.id,
      transactionId: String(verified.id ?? data.transaction_id),
      flutterwaveRef: String(verified.flw_ref ?? data.tx_ref ?? ''),
      userId,
      planId: plan.id,
      planSlug: plan.slug,
      amount: Number(verified.amount ?? 0),
      currency: String(verified.currency ?? 'USD'),
      billingCycle,
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

    if (!event || !data) {
      this.logger.warn('Received malformed Flutterwave webhook payload');
      return { status: 'ignored' };
    }

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
    // SECURITY (docs/audit-2026-07-20.md §H7)
    //
    // Flutterwave's `verif-hash` is a STATIC shared secret, not an HMAC over the
    // request body. It is byte-identical on every call, so it authenticates the
    // sender but proves nothing about *this* payload — a forged body carrying a
    // valid hash was indistinguishable from a genuine event.
    //
    // We therefore treat the webhook purely as a notification and re-fetch the
    // transaction from Flutterwave, then act only on that response. Every field
    // below reads from `verified`, never from `data`.
    const transactionId = data.id;
    if (!transactionId) {
      this.logger.warn('Flutterwave charge.completed webhook had no transaction id — ignoring');
      return;
    }

    const verified = await this.fetchVerifiedTransaction(transactionId);
    if (!verified) {
      this.logger.warn(
        `Could not re-verify Flutterwave transaction ${String(transactionId)} — ignoring webhook`,
      );
      return;
    }

    if (verified.status !== 'successful') {
      this.logger.warn(
        `Flutterwave transaction ${String(transactionId)} is ${String(verified.status)} on re-verification — ignoring`,
      );
      return;
    }

    const flutterwaveRef = String(verified.flw_ref ?? '');
    const existingBillingRecord = flutterwaveRef
      ? await this.repository.findBillingRecordByFlutterwaveRef(flutterwaveRef)
      : null;

    if (existingBillingRecord?.status === 'PAID') {
      return;
    }

    const meta = (verified.meta ?? {}) as Record<string, any>;
    const billingCycle = meta.billing_cycle || meta.interval || 'monthly';
    const plan = await this.resolvePlan(meta);
    if (!plan) {
      this.logger.warn('Unable to resolve plan for Flutterwave charge.completed webhook');
      return;
    }

    // Same amount binding as verifyPayment: a verified-but-cheaper transaction
    // must not unlock an expensive plan.
    await this.assertPaidAmountMatchesPlan(verified, plan, billingCycle === 'annual');

    const userId = await this.resolveUserId(verified, meta);
    if (!userId) {
      this.logger.warn('Unable to resolve user for Flutterwave charge.completed webhook');
      return;
    }

    const workspaceId = meta.workspaceId || await this.repository.findPrimaryWorkspaceForUser(userId);
    if (!workspaceId) {
      this.logger.warn(`Unable to resolve workspace for Flutterwave charge.completed webhook user ${userId}`);
      return;
    }

    await this.activateSubscription({
      userId,
      workspaceId,
      planId: plan.id,
      flutterwaveId: String(verified.id ?? transactionId),
      billingCycle,
    });

    let billingRecordId: string;
    if (existingBillingRecord) {
      await this.repository.updateBillingRecord(existingBillingRecord.id, {
        plan_name: plan.name,
        amount: new Prisma.Decimal(String(verified.amount ?? existingBillingRecord.amount)),
        currency: String(verified.currency ?? existingBillingRecord.currency),
        status: 'PAID',
      });
      billingRecordId = existingBillingRecord.id;
    } else {
      const billingRecord = await this.repository.createBillingRecord({
        workspace_id: workspaceId,
        user_id: userId,
        plan_name: plan.name,
        amount: new Prisma.Decimal(String(verified.amount ?? 0)),
        currency: String(verified.currency ?? 'USD'),
        status: 'PAID',
        flutterwave_ref: flutterwaveRef,
      });
      billingRecordId = billingRecord.id;
    }

    await this.syncUserStatusAfterPayment(userId);
    await this.dispatchBillingEvent(workspaceId, 'billing.payment_succeeded', {
      billingRecordId,
      transactionId: String(verified.id ?? transactionId),
      flutterwaveRef,
      userId,
      planId: plan.id,
      planSlug: plan.slug,
      // Outbound webhook payload: stays a JSON number to preserve the existing
      // contract for consumers. Internal storage uses Decimal.
      amount: Number(verified.amount ?? 0),
      currency: String(verified.currency ?? 'USD'),
      billingCycle,
    });
  }

  private async handleSubscriptionCancelled(data: Record<string, any>) {
    const subscription = await this.repository.findByFlutterwaveId(data.id?.toString());
    if (subscription) {
      await this.repository.updateSubscription(subscription.id, { status: 'CANCELLED' });
      await this.dispatchBillingEvent(subscription.workspace_id, 'billing.subscription_cancelled', {
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        planId: subscription.plan_id,
        flutterwaveSubscriptionId: subscription.flutterwave_subscription_id,
      });
    }
  }

  private async handlePaymentFailed(data: Record<string, any>) {
    const meta = (data.meta ?? {}) as Record<string, any>;
    const flutterwaveRef = String(data.flw_ref ?? '');
    const existing = flutterwaveRef
      ? await this.repository.findBillingRecordByFlutterwaveRef(flutterwaveRef)
      : null;

    if (existing?.status === 'PAID' || existing?.status === 'FAILED') {
      return;
    }

    const userId = await this.resolveUserId(data, meta);
    if (!userId) {
      this.logger.warn('Unable to resolve user for Flutterwave charge.failed webhook');
      return;
    }

    const workspaceId = meta.workspaceId || await this.repository.findPrimaryWorkspaceForUser(userId);
    if (!workspaceId) {
      this.logger.warn(`Unable to resolve workspace for Flutterwave charge.failed webhook user ${userId}`);
      return;
    }

    const plan = await this.resolvePlan(meta);
    const planName = plan?.name ?? String(meta.plan ?? 'Unknown');

    if (existing) {
      await this.repository.updateBillingRecord(existing.id, {
        plan_name: planName,
        amount: new Prisma.Decimal(String(data.amount ?? existing.amount)),
        currency: String(data.currency ?? existing.currency),
        status: 'FAILED',
      });
      await this.dispatchBillingEvent(workspaceId, 'billing.payment_failed', {
        billingRecordId: existing.id,
        flutterwaveRef,
        userId,
        amount: new Prisma.Decimal(String(data.amount ?? existing.amount)),
        currency: String(data.currency ?? existing.currency),
        planName,
      });
      return;
    }

    const billingRecord = await this.repository.createBillingRecord({
      workspace_id: workspaceId,
      user_id: userId,
      plan_name: planName,
      amount: new Prisma.Decimal(String(data.amount ?? 0)),
      currency: String(data.currency ?? 'USD'),
      status: 'FAILED',
      flutterwave_ref: flutterwaveRef,
    });

    await this.dispatchBillingEvent(workspaceId, 'billing.payment_failed', {
      billingRecordId: billingRecord.id,
      flutterwaveRef,
      userId,
      amount: new Prisma.Decimal(String(data.amount ?? 0)),
      currency: String(data.currency ?? 'USD'),
      planName,
    });
  }

  private calculatePeriodEnd(interval: string): Date {
    const now = new Date();
    if (interval === 'yearly' || interval === 'ANNUAL') {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
    return new Date(now.setMonth(now.getMonth() + 1));
  }

  private async activateSubscription(data: {
    userId: string;
    workspaceId: string;
    planId: string;
    flutterwaveId: string;
    billingCycle: string;
  }) {
    if (data.flutterwaveId) {
      const existingSubscription = await this.repository.findByFlutterwaveId(data.flutterwaveId);
      if (existingSubscription) {
        return existingSubscription;
      }
    }

    const plan = await this.repository.findPlanById(data.planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.repository.createSubscription({
      user_id: data.userId,
      workspace_id: data.workspaceId,
      plan_id: data.planId,
      status: 'ACTIVE',
      flutterwave_subscription_id: data.flutterwaveId,
      billing_cycle: data.billingCycle === 'annual' || data.billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
      locked_limits: plan.limits as Record<string, any>,
      locked_features: plan.features as Record<string, any>,
      current_period_start: new Date(),
      current_period_end: this.calculatePeriodEnd(data.billingCycle),
    });
  }

  private async syncUserStatusAfterPayment(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      return;
    }

    const currentStatus = user.status as UserStatus;
    if (currentStatus === 'SUSPENDED' || currentStatus === 'DEACTIVATED') {
      return;
    }

    const nextStatus: UserStatus = user.email_verified ? 'ACTIVE' : 'PENDING_VERIFICATION';
    if (currentStatus !== nextStatus) {
      await this.repository.updateUserStatus(userId, nextStatus);
    }
  }

  private async dispatchBillingEvent(workspaceId: string, event: string, data: Record<string, unknown>) {
    try {
      await this.webhooksService.dispatchEvent(workspaceId, event, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown billing webhook dispatch error';
      this.logger.warn(`Billing webhook dispatch failed for ${event}: ${message}`);
    }
  }

  private async resolvePlan(meta: Record<string, any>) {
    if (meta.planId) {
      return this.repository.findPlanById(String(meta.planId));
    }
    if (meta.plan) {
      return this.repository.findPlanBySlug(String(meta.plan).toLowerCase());
    }
    return null;
  }

  private async resolveUserId(data: Record<string, any>, meta: Record<string, any>) {
    if (meta.userId) {
      return String(meta.userId);
    }

    const email = data.customer?.email;
    if (!email) {
      return null;
    }

    const user = await this.repository.findUserByEmail(String(email));
    return user?.id ?? null;
  }
}
