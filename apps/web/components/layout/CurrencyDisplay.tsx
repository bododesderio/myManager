interface CurrencyDisplayProps {
  currency: string;
  amount?: number;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  NGN: '\u20A6',
  KES: 'KSh',
  GHS: 'GH\u20B5',
  ZAR: 'R',
};

export function CurrencyDisplay({ currency, amount }: CurrencyDisplayProps) {
  const symbol = currencySymbols[currency] ?? currency;

  if (amount !== undefined) {
    return (
      <span className="text-sm font-medium">
        {symbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  }

  return (
    <span className="rounded-brand border px-2 py-1 text-xs font-medium text-gray-600">
      {symbol} {currency}
    </span>
  );
}
