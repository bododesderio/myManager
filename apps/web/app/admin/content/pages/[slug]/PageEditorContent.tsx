'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'RICHTEXT'
  | 'URL'
  | 'IMAGE_URL'
  | 'COLOR'
  | 'BOOLEAN'
  | 'NUMBER'
  | 'JSON';

interface CmsField {
  id: string;
  field_key: string;
  field_type: FieldType;
  value: string;
  order_index: number;
}

interface CmsSection {
  id: string;
  section_key: string;
  is_visible: boolean;
  order_index: number;
  fields: CmsField[];
}

interface CmsPageData {
  id: string;
  title: string;
  slug: string;
  sections: CmsSection[];
}

function humanizeKey(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function useAutoSave() {
  const { toast } = useToast();
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const save = useCallback(
    (fieldId: string, value: string) => {
      const existing = timersRef.current[fieldId];
      if (existing) clearTimeout(existing);
      timersRef.current[fieldId] = setTimeout(async () => {
        try {
          const res = await fetch(`/api/v1/admin/cms/fields/${fieldId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
          });
          if (!res.ok) throw new Error('Failed to auto-save field');
        } catch {
          toast({ title: 'Auto-save failed', variant: 'error' });
        }
      }, 800);
    },
    [toast],
  );

  return save;
}

function FieldRenderer({
  field,
  onChange,
}: {
  field: CmsField;
  onChange: (value: string) => void;
}) {
  const [mdPreview, setMdPreview] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const baseInput =
    'mt-1 block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none';

  switch (field.field_type) {
    case 'TEXT':
      return <input type="text" value={field.value} onChange={(e) => onChange(e.target.value)} className={baseInput} />;
    case 'TEXTAREA':
      return <textarea rows={3} value={field.value} onChange={(e) => onChange(e.target.value)} className={baseInput} />;
    case 'RICHTEXT':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMdPreview(false)}
              className={`rounded px-2 py-1 text-xs font-medium ${!mdPreview ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMdPreview(true)}
              className={`rounded px-2 py-1 text-xs font-medium ${mdPreview ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Preview
            </button>
          </div>
          {mdPreview ? (
            <div
              className="prose prose-sm max-w-none rounded-brand border bg-gray-50 p-3"
              dangerouslySetInnerHTML={{
                __html: field.value
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br />'),
              }}
            />
          ) : (
            <textarea
              rows={6}
              value={field.value}
              onChange={(e) => onChange(e.target.value)}
              className={`${baseInput} font-mono text-xs`}
            />
          )}
        </div>
      );
    case 'URL':
    case 'IMAGE_URL':
      return (
        <input
          type="url"
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
          placeholder="https://..."
        />
      );
    case 'COLOR':
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={field.value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border"
          />
          <input type="text" value={field.value} onChange={(e) => onChange(e.target.value)} className={`${baseInput} w-32`} />
        </div>
      );
    case 'BOOLEAN':
      return (
        <button
          type="button"
          onClick={() => onChange(field.value === 'true' ? 'false' : 'true')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            field.value === 'true' ? 'bg-brand-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition ${
              field.value === 'true' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      );
    case 'NUMBER':
      return <input type="number" value={field.value} onChange={(e) => onChange(e.target.value)} className={`${baseInput} w-32`} />;
    case 'JSON':
      return (
        <div className="space-y-2">
          <textarea
            rows={6}
            value={field.value}
            onChange={(e) => {
              onChange(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonError(null);
              } catch (error) {
                setJsonError((error as Error).message);
              }
            }}
            className={`${baseInput} font-mono text-xs ${jsonError ? 'border-red-400' : ''}`}
          />
          {jsonError && <p className="text-xs text-red-500">Invalid JSON: {jsonError}</p>}
        </div>
      );
    default:
      return <input type="text" value={field.value} onChange={(e) => onChange(e.target.value)} className={baseInput} />;
  }
}

export function PageEditorContent({ slug }: { slug: string }) {
  const { toast } = useToast();
  const [pageData, setPageData] = useState<CmsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const autoSave = useAutoSave();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/cms/pages/${slug}`);
      if (!res.ok) throw new Error('Failed to load page');
      const data = (await res.json()) as CmsPageData;
      setPageData(data);
    } catch {
      toast({ title: 'Could not load page editor', variant: 'error' });
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleCollapse(sectionId: string) {
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  async function toggleVisibility(sectionId: string, current: boolean) {
    if (!pageData) return;
    setPageData({
      ...pageData,
      sections: pageData.sections.map((section) =>
        section.id === sectionId ? { ...section, is_visible: !current } : section,
      ),
    });

    try {
      const res = await fetch(`/api/v1/admin/cms/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !current }),
      });
      if (!res.ok) throw new Error('Failed to update section');
    } catch {
      toast({ title: 'Failed to update visibility', variant: 'error' });
    }
  }

  function handleFieldChange(sectionId: string, fieldId: string, value: string) {
    if (!pageData) return;
    setPageData({
      ...pageData,
      sections: pageData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) => (field.id === fieldId ? { ...field, value } : field)),
            }
          : section,
      ),
    });
    autoSave(fieldId, value);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-brand bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Page Editor</h1>
        <div className="rounded-brand border bg-white p-6 text-sm text-gray-500">
          This page could not be loaded from the CMS.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/content/pages" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">{pageData.title}</h1>
          <p className="font-mono text-sm text-gray-500">/{pageData.slug}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">Changes auto-save after 800ms of inactivity.</p>

      <div className="space-y-4">
        {pageData.sections
          .sort((a, b) => a.order_index - b.order_index)
          .map((section) => {
            const isCollapsed = collapsed[section.id];
            return (
              <div
                key={section.id}
                className={`rounded-brand border bg-white shadow-sm ${!section.is_visible ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between border-b px-6 py-3">
                  <button onClick={() => toggleCollapse(section.id)} className="flex items-center gap-2 font-heading text-base font-semibold">
                    <svg
                      className={`h-4 w-4 text-gray-400 transition ${isCollapsed ? '' : 'rotate-90'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {humanizeKey(section.section_key)}
                    <span className="ml-2 text-xs font-normal text-gray-400">{section.section_key}</span>
                  </button>

                  <button
                    onClick={() => void toggleVisibility(section.id, section.is_visible)}
                    className={`rounded p-1 transition hover:bg-gray-100 ${section.is_visible ? 'text-gray-500' : 'text-gray-300'}`}
                    title={section.is_visible ? 'Hide section' : 'Show section'}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="divide-y px-6">
                    {section.fields
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((field) => (
                        <div key={field.id} className="py-4">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            {humanizeKey(field.field_key)}
                            <span className="ml-2 text-xs font-normal text-gray-400">{field.field_type}</span>
                          </label>
                          <FieldRenderer field={field} onChange={(value) => handleFieldChange(section.id, field.id, value)} />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
