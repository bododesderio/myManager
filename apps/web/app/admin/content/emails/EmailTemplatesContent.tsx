'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  lastEdited: string;
}

const initialTemplates: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', trigger: 'On signup', lastEdited: '1 week ago' },
  { id: '2', name: 'Password Reset', trigger: 'On request', lastEdited: '2 weeks ago' },
  { id: '3', name: 'Post Published', trigger: 'Post event', lastEdited: '3 days ago' },
  { id: '4', name: 'Weekly Report', trigger: 'Cron weekly', lastEdited: '5 days ago' },
  { id: '5', name: 'Trial Expiring', trigger: '3 days before expiry', lastEdited: '1 week ago' },
  { id: '6', name: 'Invoice', trigger: 'On payment', lastEdited: '2 weeks ago' },
];

export function EmailTemplatesContent() {
  const { toast } = useToast();
  const [templates] = useState<EmailTemplate[]>(initialTemplates);

  function handleEdit(id: string) {
    toast({ title: 'Opening template editor...', variant: 'info' });
  }

  function handlePreview(id: string) {
    toast({ title: 'Opening preview...', variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Email Templates</h1>
        <button className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
          New Template
        </button>
      </div>

      <div className="rounded-brand border bg-white shadow-sm">
        <div className="divide-y">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-gray-500">
                  Trigger: {template.trigger} &middot; Edited {template.lastEdited}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template.id)}
                  className="text-sm text-brand-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handlePreview(template.id)}
                  className="text-sm text-gray-400 hover:underline"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
