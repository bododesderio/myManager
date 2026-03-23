interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, change, trend = 'neutral', icon }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const trendArrows = {
    up: '\u2191',
    down: '\u2193',
    neutral: '\u2192',
  };

  return (
    <div className="rounded-brand border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {change && (
        <p className={`mt-1 text-sm font-medium ${trendColors[trend]}`}>
          {trendArrows[trend]} {change}
        </p>
      )}
    </div>
  );
}
