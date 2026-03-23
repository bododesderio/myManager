'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface LegalDoc {
  id: string;
  name: string;
  lastUpdated: string;
  status: 'Published' | 'Draft';
}

const initialDocs: LegalDoc[] = [
  { id: '1', name: 'Privacy Policy', lastUpdated: '2026-03-01', status: 'Published' },
  { id: '2', name: 'Terms of Service', lastUpdated: '2026-03-01', status: 'Published' },
  { id: '3', name: 'Cookie Policy', lastUpdated: '2026-02-15', status: 'Published' },
  { id: '4', name: 'Data Processing Agreement', lastUpdated: '2026-01-10', status: 'Draft' },
  { id: '5', name: 'Acceptable Use Policy', lastUpdated: '2026-02-20', status: 'Published' },
];

export function LegalContent() {
  const { toast } = useToast();
  const [docs] = useState<LegalDoc[]>(initialDocs);

  function handleEdit(id: string) {
    toast({ title: 'Opening legal document editor...', variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Legal Content</h1>
      <p className="text-sm text-gray-500">Manage legal documents and policies.</p>

      <div className="rounded-brand border bg-white shadow-sm">
        <div className="divide-y">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-sm text-gray-500">
                  Updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {doc.status}
                </span>
                <button
                  onClick={() => handleEdit(doc.id)}
                  className="text-sm text-brand-primary hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
