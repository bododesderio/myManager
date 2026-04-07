'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import styles from './TranslationsContent.module.css';

interface TranslationKey {
  id: string;
  key: string;
  values: Record<string, string>; // lang code -> translated value
}

interface LanguageSummary {
  code: string;
  name: string;
  progress: number;
  keyCount: number;
}

const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
];

export function TranslationsContent() {
  const { toast } = useToast();
  const [languages, setLanguages] = useState<LanguageSummary[]>([]);
  const [translations, setTranslations] = useState<TranslationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/translations');
      if (!res.ok) throw new Error('Failed to load translations');
      const data = (await res.json()) as {
        items?: TranslationKey[];
        languages?: LanguageSummary[];
      };
      setTranslations(data.items ?? []);
      setLanguages(
        data.languages ??
          SUPPORTED_LANGUAGES.map((l) => ({ ...l, progress: 0, keyCount: 0 })),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load translations';
      setError(msg);
      toast({ title: msg, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEditLanguage = useCallback(
    (code: string) => {
      setEditingLang(code);
      // Pre-fill edited values with current translations for this language
      const values: Record<string, string> = {};
      translations.forEach((t) => {
        values[t.id] = t.values[code] ?? '';
      });
      setEditedValues(values);
      setSearchTerm('');
    },
    [translations],
  );

  const handleBack = useCallback(() => {
    setEditingLang(null);
    setEditedValues({});
    setSearchTerm('');
  }, []);

  const handleValueChange = useCallback((translationId: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [translationId]: value }));
  }, []);

  const handleSave = useCallback(
    async (translationId: string) => {
      if (!editingLang) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/v1/admin/translations/${translationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: editingLang,
            value: editedValues[translationId] ?? '',
          }),
        });
        if (!res.ok) throw new Error('Failed to save translation');
        toast({ title: 'Translation updated', variant: 'success' });
        // Update local state
        setTranslations((prev) =>
          prev.map((t) =>
            t.id === translationId
              ? { ...t, values: { ...t.values, [editingLang]: editedValues[translationId] ?? '' } }
              : t,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Save failed';
        toast({ title: msg, variant: 'error' });
      } finally {
        setSaving(false);
      }
    },
    [editingLang, editedValues, toast],
  );

  const handleSaveAll = useCallback(async () => {
    if (!editingLang) return;
    setSaving(true);
    try {
      const updates = Object.entries(editedValues).map(([id, value]) => ({ id, value }));
      const results = await Promise.allSettled(
        updates.map((update) =>
          fetch(`/api/v1/admin/translations/${update.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: editingLang, value: update.value }),
          }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        toast({ title: `${failed} translation(s) failed to save`, variant: 'error' });
      } else {
        toast({ title: 'All translations saved', variant: 'success' });
      }
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast({ title: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [editingLang, editedValues, toast, load]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-brand bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && translations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Translations</h1>
        <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 text-sm font-semibold text-red-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Language editing mode
  if (editingLang) {
    const langName = SUPPORTED_LANGUAGES.find((l) => l.code === editingLang)?.name ?? editingLang;
    const filteredTranslations = searchTerm
      ? translations.filter(
          (t) =>
            t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.values.en ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : translations;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-sm text-brand-primary hover:underline">
              &larr; Back to languages
            </button>
            <h1 className="font-heading text-2xl font-bold">
              {langName} ({editingLang})
            </h1>
          </div>
          <button
            onClick={() => void handleSaveAll()}
            disabled={saving}
            className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search keys or English text..."
          className="w-full rounded-brand border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />

        {filteredTranslations.length === 0 ? (
          <div className="rounded-brand border bg-white p-8 text-center shadow-sm">
            <p className="text-gray-400">No translation keys found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTranslations.map((t) => (
              <div key={t.id} className="rounded-brand border bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <code className="text-xs text-gray-500">{t.key}</code>
                  <button
                    onClick={() => void handleSave(t.id)}
                    disabled={saving}
                    className="text-xs text-brand-primary hover:underline disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
                {editingLang !== 'en' && (
                  <p className="mb-2 text-sm text-gray-400">EN: {t.values.en ?? '—'}</p>
                )}
                <input
                  type="text"
                  value={editedValues[t.id] ?? ''}
                  onChange={(e) => handleValueChange(t.id, e.target.value)}
                  className="w-full rounded-brand border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder={`Translation for ${langName}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Language overview
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
                  className={`h-2 rounded-full bg-brand-primary ${styles.progressFill}`}
                  style={{ ['--progress' as string]: `${lang.progress}%` } as React.CSSProperties}
                />
              </div>
            </div>
            <button
              onClick={() => handleEditLanguage(lang.code)}
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
