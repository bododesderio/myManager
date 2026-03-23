'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface EngagementChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
}

export function EngagementChart({ data, title, color = 'var(--brand-primary)' }: EngagementChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-brand border bg-white p-6 shadow-sm">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="mt-4 flex h-48 items-end gap-1">
        {data.map((point) => {
          const height = (point.value / maxValue) * 100;
          return (
            <div key={point.date} className="group flex flex-1 flex-col items-center">
              <div className="relative w-full">
                <div
                  className="mx-auto w-full max-w-[24px] rounded-t transition-all group-hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    minHeight: '4px',
                    backgroundColor: color,
                  }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {point.value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        {data.length > 0 && (
          <>
            <span>{data[0].date}</span>
            <span>{data[data.length - 1].date}</span>
          </>
        )}
      </div>
    </div>
  );
}
