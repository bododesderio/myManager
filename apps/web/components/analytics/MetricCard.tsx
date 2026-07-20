import { Card } from '@mymanager/ui';
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
    neutral: 'text-text-2',
  };

  const trendArrows = {
    up: '\u2191',
    down: '\u2193',
    neutral: '\u2192',
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-2">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {change && (
        <p className={`mt-1 text-sm font-medium ${trendColors[trend]}`}>
          {trendArrows[trend]} {change}
        </p>
      )}
    </Card>
  );
}
