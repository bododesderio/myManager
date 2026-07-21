'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { Card } from '@mymanager/ui';
import { apiClient } from '@/lib/api/client';

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
      const data = await apiClient.get<CmsPage[]>('/admin/cms/pages');
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
        <div className="h-8 w-48 animate-pulse rounded bg-border" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-brand bg-bg-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Content Pages</h1>
        <p className="mt-1 text-sm text-text-2">Edit live CMS page sections, fields, and metadata</p>
      </div>

      <Card padding="none">
        <div className="divide-y">
          {sortedPages.map((page) => (
            <Link
              key={page.id}
              href={`/admin/content/pages/${page.slug}` as Route}
              className="flex items-center justify-between px-6 py-4 transition hover:bg-bg-2"
            >
              <div>
                <p className="font-medium">{page.title}</p>
                <p className="text-sm text-text-2">
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
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

          {sortedPages.length === 0 && (
            <div className="px-6 py-12 text-center text-text-muted">No CMS pages found.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
