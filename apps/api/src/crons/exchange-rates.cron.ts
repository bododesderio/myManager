import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import Redis from 'ioredis';
import axios from 'axios';
import { withDistributedLock } from '../common/utils/distributed-lock';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const SUPPORTED_CURRENCIES = ['UGX', 'KES', 'TZS', 'NGN', 'GHS', 'ZAR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'BRL', 'AED', 'SAR', 'EGP', 'MAD'];

@Injectable()
export class ExchangeRatesCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * *') // Every hour
  async fetchExchangeRates() {
    await withDistributedLock('exchange-rates', 55 * 60 * 1000, async () => {
      const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY;
      if (!apiKey) return;

      const response = await axios.get(`https://openexchangerates.org/api/latest.json`, {
        params: { app_id: apiKey, symbols: SUPPORTED_CURRENCIES.join(',') },
      });

      const rates = response.data.rates;
      const now = new Date();

      for (const [code, rateValue] of Object.entries(rates) as [string, number][]) {
        await this.prisma.exchangeRate.create({
          data: { from_currency: 'USD', to_currency: code, rate: rateValue, fetched_at: now },
        });
        await redis.setex(`exchange_rate:${code}`, 3600, rateValue.toString());
      }
    });
  }
}
