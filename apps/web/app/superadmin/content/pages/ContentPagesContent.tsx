'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
  is_published: boolean;
  sections?: Array<{ id: string }>;
}

export function ContentPagesContent() {
  const { toast } = useToast();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/cms/pages');
      if (!res.ok) throw new Error('Failed to load pages');
      const data = (await res.json()) as CmsPage[];
      setPages(data);
    } catch {
      toast({ title: 'Could not load CMS pages', variant: 'error' });
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => a.title.localeCompare(b.title)),
    [pages],
  );

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-brand bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Content Pages</h1>
        <p className="mt-1 text-sm text-gray-500">Edit live CMS page sections, fields, and metadata</p>
      </div>

      <div className="rounded-brand border bg-white shadow-sm">
        <div className="divide-y">
          {sortedPages.map((page) => (
            <Link
              key={page.id}
              href={`/admin/content/pages/${page.slug}` as Route}
              className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{page.title}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs">/{page.slug}</span> &middot;{' '}
                  {page.sections?.length ?? 0} sections &middot; Updated {timeAgo(page.updated_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    page.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {page.is_published ? 'Published' : 'Draft'}
                </span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

          {sortedPages.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">No CMS pages found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
