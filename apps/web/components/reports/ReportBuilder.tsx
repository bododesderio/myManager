'use client';

import { useState } from 'react';

interface ReportWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
}

interface ReportBuilderProps {
  onSave?: (widgets: ReportWidget[]) => void;
}

const AVAILABLE_WIDGETS: ReportWidget[] = [
  { id: 'followers', type: 'metric', title: 'Total Followers' },
  { id: 'engagement-chart', type: 'chart', title: 'Engagement Over Time' },
  { id: 'top-posts', type: 'table', title: 'Top Performing Posts' },
  { id: 'platform-breakdown', type: 'chart', title: 'Platform Breakdown' },
  { id: 'impressions', type: 'metric', title: 'Total Impressions' },
  { id: 'custom-text', type: 'text', title: 'Custom Text Block' },
];

export function ReportBuilder({ onSave }: ReportBuilderProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<ReportWidget[]>([]);

  const addWidget = (widget: ReportWidget) => {
    setSelectedWidgets((prev) => [...prev, { ...widget, id: `${widget.id}-${Date.now()}` }]);
  };

  const removeWidget = (widgetId: string) => {
    setSelectedWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-heading text-lg font-semibold">Report Layout</h3>
        {selectedWidgets.length === 0 ? (
          <div className="rounded-brand border-2 border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
            Add widgets from the panel on the right to build your report.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedWidgets.map((widget) => (
              <div key={widget.id} className="flex items-center justify-between rounded-brand border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-brand-primary/10 px-2 py-1 text-xs font-medium text-brand-primary">
                    {widget.type}
                  </span>
                  <span className="font-medium">{widget.title}</span>
                </div>
                <button onClick={() => removeWidget(widget.id)} className="text-sm text-red-500 hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onSave?.(selectedWidgets)}
          disabled={selectedWidgets.length === 0}
          className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          Save Report
        </button>
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold">Available Widgets</h3>
        <div className="mt-4 space-y-2">
          {AVAILABLE_WIDGETS.map((widget) => (
            <button
              key={widget.id}
              onClick={() => addWidget(widget)}
              className="flex w-full items-center justify-between rounded-brand border bg-white px-4 py-3 text-sm transition hover:border-brand-primary"
            >
              <span>{widget.title}</span>
              <span className="text-xs text-gray-400">{widget.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
