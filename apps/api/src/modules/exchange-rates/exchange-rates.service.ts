import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestRate(currency: string) {
    const normalized = currency.toUpperCase();

    if (normalized === 'USD') {
      return {
        from: 'USD',
        to: 'USD',
        rate: 1,
        fetchedAt: new Date().toISOString(),
      };
    }

    const latest = await this.prisma.exchangeRate.findFirst({
      where: { from_currency: 'USD', to_currency: normalized },
      orderBy: { fetched_at: 'desc' },
    });

    return {
      from: 'USD',
      to: normalized,
      rate: latest?.rate ?? 1,
      fetchedAt: latest?.fetched_at?.toISOString() ?? null,
    };
  }
}
