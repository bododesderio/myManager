'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/lib/hooks/useNotificationPrefs';
import { useToast } from '@/providers/ToastProvider';

const EVENT_TYPES = [
  { id: 'post-published', label: 'Post Published', description: 'When a scheduled post is published.' },
  { id: 'post-failed', label: 'Post Failed', description: 'When a scheduled post fails to publish.' },
  { id: 'approval-request', label: 'Approval Requested', description: 'When a team member submits content for approval.' },
  { id: 'comment-received', label: 'New Comment', description: 'When a new comment is received on a post.' },
  { id: 'weekly-report', label: 'Weekly Report', description: 'Weekly performance summary email.' },
] as const;

const CHANNELS = ['email', 'push', 'in_app'] as const;
const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  push: 'Push',
  in_app: 'In-App',
};

type Prefs = Record<string, Record<string, boolean>>;

export default function NotificationsContent() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const { addToast } = useToast();

  const [localPrefs, setLocalPrefs] = useState<Prefs>({});

  useEffect(() => {
    if (prefs) {
      setLocalPrefs(prefs as Prefs);
    }
  }, [prefs]);

  const toggle = (eventId: string, channel: string) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [channel]: !prev[eventId]?.[channel],
      },
    }));
  };

  const handleSave = () => {
    updatePrefs.mutate(localPrefs, {
      onSuccess: () => addToast({ type: 'success', message: 'Notification preferences saved.' }),
      onError: () => addToast({ type: 'error', message: 'Failed to save notification preferences.' }),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Notification Settings</h1>

      <div className="max-w-3xl rounded-brand border bg-white shadow-sm">
        {/* Header row */}
        <div className="flex items-center border-b px-6 py-3">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">Event</span>
          </div>
          {CHANNELS.map((ch) => (
            <div key={ch} className="w-20 text-center">
              <span className="text-sm font-medium text-gray-700">{CHANNEL_LABELS[ch]}</span>
            </div>
          ))}
        </div>

        {/* Event rows */}
        <div className="divide-y">
          {EVENT_TYPES.map((event) => (
            <div key={event.id} className="flex items-center px-6 py-4">
              <div className="flex-1">
                <p className="font-medium">{event.label}</p>
                <p className="text-sm text-gray-500">{event.description}</p>
              </div>
              {CHANNELS.map((ch) => (
                <div key={ch} className="flex w-20 justify-center">
                  <button
                    type="button"
                    onClick={() => toggle(event.id, ch)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      localPrefs[event.id]?.[ch] ? 'bg-brand-primary' : 'bg-gray-300'
                    }`}
                    aria-label={`${event.label} ${CHANNEL_LABELS[ch]}`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        localPrefs[event.id]?.[ch] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={updatePrefs.isPending}
        className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
      >
        {updatePrefs.isPending ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
