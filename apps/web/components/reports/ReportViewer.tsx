interface ReportSection {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
  data?: Record<string, unknown>;
}

interface ReportViewerProps {
  title: string;
  dateRange: string;
  sections: ReportSection[];
}

export function ReportViewer({ title, dateRange, sections }: ReportViewerProps) {
  return (
    <div className="space-y-6">
      <header className="border-b pb-4">
        <h2 className="font-heading text-2xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500">{dateRange}</p>
      </header>

      {sections.map((section) => (
        <div key={section.id} className="rounded-brand border bg-white p-6 shadow-sm">
          <h3 className="font-heading text-lg font-semibold">{section.title}</h3>
          <div className="mt-4">
            {section.type === 'metric' && (
              <div className="text-3xl font-bold text-brand-primary">--</div>
            )}
            {section.type === 'chart' && (
              <div className="flex h-48 items-center justify-center rounded-brand border border-dashed border-gray-300 text-sm text-gray-400">
                Chart: {section.title}
              </div>
            )}
            {section.type === 'table' && (
              <div className="flex h-32 items-center justify-center rounded-brand border border-dashed border-gray-300 text-sm text-gray-400">
                Table: {section.title}
              </div>
            )}
            {section.type === 'text' && (
              <p className="text-sm text-gray-600">Custom text content block.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
