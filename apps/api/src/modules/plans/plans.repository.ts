import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { getSharedRedis } from '../../common/redis/shared-redis';

const redis = getSharedRedis();

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findAllPublic() {
    const cached = await redis.get('plans:public');
    if (cached) return JSON.parse(cached);

    const plans = await this.prisma.plan.findMany({
      where: { is_active: true },
      orderBy: { price_monthly_usd: 'asc' },
    });

    await redis.setex('plans:public', 60, JSON.stringify(plans));
    return plans;
  }

  async findById(id: string) {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return this.prisma.plan.findUnique({ where: { slug } });
  }

  async create(data: {
    name: string;
    slug: string;
    price_monthly_usd: number;
    price_annual_usd: number;
    seat_price_usd: number;
    limits: Record<string, any>;
    features: Record<string, boolean>;
    is_active: boolean;
  }) {
    const plan = await this.prisma.plan.create({ data });
    await redis.del('plans:public');
    return plan;
  }

  async update(id: string, data: Record<string, any>) {
    const plan = await this.prisma.plan.update({ where: { id }, data });
    await redis.del('plans:public');
    return plan;
  }

  async softDelete(id: string) {
    const plan = await this.prisma.plan.update({
      where: { id },
      data: { is_active: false },
    });
    await redis.del('plans:public');
    return plan;
  }

  async getExchangeRate(currency: string): Promise<number> {
    const cached = await redis.get(`exchange_rate:${currency}`);
    if (cached) return Number(cached);

    const rate = await this.prisma.exchangeRate.findFirst({
      where: { to_currency: currency },
      orderBy: { fetched_at: 'desc' },
    });

    const value = rate?.rate ?? 1;
    await redis.setex(`exchange_rate:${currency}`, 3600, value.toString());
    return value;
  }
}
