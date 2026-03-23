'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePreferences, useUpdatePreferences } from '@/lib/hooks/useUser';
import { useToast } from '@/providers/ToastProvider';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French (Fran\u00e7ais)' },
  { value: 'sw', label: 'Swahili (Kiswahili)' },
  { value: 'ar', label: 'Arabic (\u0627\u0644\u0639\u0631\u0628\u064a\u0629)' },
  { value: 'es', label: 'Spanish (Espa\u00f1ol)' },
  { value: 'pt', label: 'Portuguese (Portugu\u00eas)' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
];

export default function LanguageContent() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const { addToast } = useToast();

  const prefs = preferences as any;

  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    if (prefs) {
      setLanguage(prefs.language ?? 'en');
      setCurrency(prefs.currency ?? 'USD');
    }
  }, [prefs]);

  const handleSave = () => {
    updatePreferences.mutate(
      { language, currency },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Language and currency preferences saved.' }),
        onError: () => addToast({ type: 'error', message: 'Failed to save preferences.' }),
      },
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Language &amp; Region</h1>

      <div className="max-w-2xl space-y-6">
        {/* Language */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Language</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-4 block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Currency</h2>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-4 block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
          >
            {CURRENCIES.map((cur) => (
              <option key={cur.value} value={cur.value}>
                {cur.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={updatePreferences.isPending}
          className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
