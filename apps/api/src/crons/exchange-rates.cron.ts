import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import { withDistributedLock } from '../common/utils/distributed-lock';
import { getSharedRedis } from '../common/redis/shared-redis';

const redis = getSharedRedis();

const SUPPORTED_CURRENCIES = ['UGX', 'KES', 'TZS', 'NGN', 'GHS', 'ZAR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'BRL', 'AED', 'SAR', 'EGP', 'MAD'];

@Injectable()
export class ExchangeRatesCron {
  private readonly logger = new Logger(ExchangeRatesCron.name);
  private warnedMissingKey = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * *') // Every hour
  async fetchExchangeRates() {
    await withDistributedLock('exchange-rates', 55 * 60 * 1000, async () => {
      const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY;
      if (!apiKey) {
        if (!this.warnedMissingKey) {
          this.logger.warn(
            'OPEN_EXCHANGE_RATES_API_KEY is not set — exchange rates will not be refreshed. Set the env var to enable.',
          );
          this.warnedMissingKey = true;
        }
        return;
      }

      try {
        const response = await axios.get(`https://openexchangerates.org/api/latest.json`, {
          params: { app_id: apiKey, symbols: SUPPORTED_CURRENCIES.join(',') },
          timeout: 10000,
        });

        const rates = response.data.rates;
        const now = new Date();

        for (const [code, rateValue] of Object.entries(rates) as [string, number][]) {
          await this.prisma.exchangeRate.create({
            data: { from_currency: 'USD', to_currency: code, rate: rateValue, fetched_at: now },
          });
          await redis.setex(`exchange_rate:${code}`, 3600, rateValue.toString());
        }
        this.logger.log(`Refreshed ${Object.keys(rates).length} exchange rates`);
      } catch (err) {
        this.logger.error(`Exchange rates fetch failed: ${(err as Error).message}`);
      }
    });
  }
}
