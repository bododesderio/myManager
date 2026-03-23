interface TimelineEvent {
  id: string;
  type: 'submitted' | 'approved' | 'rejected' | 'commented' | 'revised';
  user: string;
  timestamp: string;
  message?: string;
}

interface ApprovalTimelineProps {
  events: TimelineEvent[];
}

const eventStyles: Record<TimelineEvent['type'], { color: string; label: string }> = {
  submitted: { color: 'bg-blue-500', label: 'Submitted for review' },
  approved: { color: 'bg-green-500', label: 'Approved' },
  rejected: { color: 'bg-red-500', label: 'Rejected' },
  commented: { color: 'bg-yellow-500', label: 'Commented' },
  revised: { color: 'bg-purple-500', label: 'Revised' },
};

export function ApprovalTimeline({ events }: ApprovalTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const style = eventStyles[event.type];
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${style.color}`} />
              {index < events.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
            </div>
            <div className="pb-6">
              <p className="text-sm font-medium">
                {event.user} &mdash; {style.label}
              </p>
              <p className="text-xs text-gray-500">{event.timestamp}</p>
              {event.message && (
                <p className="mt-1 rounded-brand border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {event.message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
