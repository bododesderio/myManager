'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface Language {
  code: string;
  name: string;
  progress: number;
  keyCount: number;
}

const initialLanguages: Language[] = [
  { code: 'en', name: 'English', progress: 100, keyCount: 420 },
  { code: 'fr', name: 'French', progress: 85, keyCount: 357 },
  { code: 'es', name: 'Spanish', progress: 72, keyCount: 302 },
  { code: 'pt', name: 'Portuguese', progress: 68, keyCount: 286 },
  { code: 'ar', name: 'Arabic', progress: 45, keyCount: 189 },
  { code: 'yo', name: 'Yoruba', progress: 30, keyCount: 126 },
];

export function TranslationsContent() {
  const { toast } = useToast();
  const [languages] = useState<Language[]>(initialLanguages);

  function handleEdit(code: string) {
    toast({ title: `Opening translations for ${code}...`, variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Translations</h1>
      <p className="text-sm text-gray-500">Manage translations for all supported languages.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {languages.map((lang) => (
          <div key={lang.code} className="rounded-brand border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">{lang.name}</h3>
              <span className="text-sm font-medium text-gray-500">{lang.code}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{lang.keyCount} keys</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{lang.progress}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-brand-primary"
                  style={{ width: `${lang.progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => handleEdit(lang.code)}
              className="mt-3 text-sm text-brand-primary hover:underline"
            >
              Edit Translations
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
