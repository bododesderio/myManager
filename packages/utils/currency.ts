export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimal_places: number;
  rounding: number;
}

const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', decimal_places: 2, rounding: 1 },
  EUR: { code: 'EUR', symbol: '€', decimal_places: 2, rounding: 1 },
  GBP: { code: 'GBP', symbol: '£', decimal_places: 2, rounding: 1 },
  UGX: { code: 'UGX', symbol: 'UGX', decimal_places: 0, rounding: 100 },
  KES: { code: 'KES', symbol: 'KES', decimal_places: 0, rounding: 1 },
  NGN: { code: 'NGN', symbol: '₦', decimal_places: 0, rounding: 1 },
  JPY: { code: 'JPY', symbol: '¥', decimal_places: 0, rounding: 10 },
  BRL: { code: 'BRL', symbol: 'R$', decimal_places: 2, rounding: 1 },
  ZAR: { code: 'ZAR', symbol: 'R', decimal_places: 2, rounding: 1 },
};

export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES[code.toUpperCase()] ?? CURRENCIES.USD;
}

export function convertCurrency(amountUsd: number, rate: number, currencyCode: string): number {
  const config = getCurrencyConfig(currencyCode);
  const converted = amountUsd * rate;
  const rounded = Math.ceil(converted / config.rounding) * config.rounding;
  return Number(rounded.toFixed(config.decimal_places));
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const config = getCurrencyConfig(currencyCode);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimal_places,
    maximumFractionDigits: config.decimal_places,
  }).format(amount);
}
