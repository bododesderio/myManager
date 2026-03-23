import { Injectable, NotFoundException } from '@nestjs/common';
import { PlansRepository } from './plans.repository';

@Injectable()
export class PlansService {
  constructor(private readonly repository: PlansRepository) {}

  async listAll(currency: string) {
    const plans = await this.repository.findAllPublic();
    if (currency !== 'USD') {
      const rate = await this.repository.getExchangeRate(currency);
      return plans.map((plan: Record<string, unknown> & { priceMonthly: number; priceYearly: number; seatPrice: number }) => ({
        ...plan,
        priceMonthlyLocal: Number((plan.priceMonthly * rate).toFixed(2)),
        priceYearlyLocal: Number((plan.priceYearly * rate).toFixed(2)),
        seatPriceLocal: Number((plan.seatPrice * rate).toFixed(2)),
        displayCurrency: currency,
      }));
    }
    return plans;
  }

  async getById(id: string) {
    const plan = await this.repository.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getBySlug(slug: string) {
    const plan = await this.repository.findBySlug(slug);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(data: {
    name: string;
    slug: string;
    price_monthly_usd: number;
    price_annual_usd: number;
    seat_price_usd: number;
    limits: Record<string, unknown>;
    features: Record<string, boolean>;
    is_active: boolean;
  }) {
    return this.repository.create(data);
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.repository.softDelete(id);
    return { message: 'Plan archived' };
  }

  async getComparison() {
    const plans = await this.repository.findAllPublic();
    const featureKeys = [
      'scheduling', 'platformPreviews', 'mentionTagging', 'bestTimeSuggestions',
      'approvalWorkflows', 'whiteLabelReports', 'bulkCsvScheduling', 'clientPortal',
      'clientInvoicing', 'webhooks', 'apiAccess', 'customDomainBio', 'whiteLabelApp',
      'slaGuarantee',
    ];

    return {
      plans: plans.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        limits: p.limits,
      })),
      features: featureKeys.map((key) => ({
        key,
        plans: plans.reduce((acc: Record<string, boolean>, p: Record<string, unknown>) => {
          acc[p.slug as string] = ((p.features as Record<string, boolean> | undefined)?.[key]) ?? false;
          return acc;
        }, {}),
      })),
    };
  }
}
