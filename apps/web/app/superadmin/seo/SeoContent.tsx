'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { FileUpload } from '@/components/FileUpload';

interface BrandResponse {
  id: string;
  config?: Record<string, unknown>;
}

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_desc: string | null;
  og_image: string | null;
  is_published: boolean;
}

interface GlobalSeoState {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
}

function emptyGlobalSeo(): GlobalSeoState {
  return {
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    canonicalUrl: '',
  };
}

export function SeoContent() {
  const { toast } = useToast();
  const [brand, setBrand] = useState<BrandResponse | null>(null);
  const [globalSeo, setGlobalSeo] = useState<GlobalSeoState>(emptyGlobalSeo());
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [brandRes, pagesRes] = await Promise.all([fetch('/api/v1/cms/brand'), fetch('/api/v1/admin/cms/pages')]);
      if (!brandRes.ok || !pagesRes.ok) throw new Error('Failed to load SEO settings');
      const [brandData, pagesData] = await Promise.all([brandRes.json(), pagesRes.json()]);
      const seo = ((brandData as BrandResponse).config?.seo as Partial<GlobalSeoState> | undefined) ?? {};
      setBrand(brandData as BrandResponse);
      setGlobalSeo({
        title: seo.title ?? '',
        description: seo.description ?? '',
        keywords: seo.keywords ?? '',
        ogImage: seo.ogImage ?? '',
        canonicalUrl: seo.canonicalUrl ?? '',
      });
      setPages(pagesData as CmsPage[]);
    } catch {
      toast({ title: 'Could not load SEO settings', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateGlobal(field: keyof GlobalSeoState, value: string) {
    setGlobalSeo((prev) => ({ ...prev, [field]: value }));
  }

  function updatePageSeo(slug: string, field: keyof CmsPage, value: string | boolean) {
    setPages((prev) => prev.map((page) => (page.slug === slug ? { ...page, [field]: value } : page)));
  }

  async function handleSaveGlobal() {
    if (!brand) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/cms/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...brand.config,
            seo: globalSeo,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save SEO settings');
      setBrand((prev) => (prev ? { ...prev, config: { ...prev.config, seo: globalSeo } } : prev));
      toast({ title: 'Global SEO saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save global SEO', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function savePageSeo(page: CmsPage) {
    try {
      const res = await fetch(`/api/v1/admin/cms/pages/${page.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          meta_title: page.meta_title || null,
          meta_desc: page.meta_desc || null,
          og_image: page.og_image || null,
          is_published: page.is_published,
        }),
      });
      if (!res.ok) throw new Error('Failed to save page SEO');
      toast({ title: `Saved SEO for /${page.slug}`, variant: 'success' });
    } catch {
      toast({ title: `Failed to save SEO for /${page.slug}`, variant: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded-brand bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">SEO Management</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Global SEO Settings</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">Default Title</label>
              <input id="seoTitle" type="text" value={globalSeo.title} onChange={(e) => updateGlobal('title', e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
            </div>
            <div>
              <label htmlFor="seoDesc" className="block text-sm font-medium text-gray-700">Default Description</label>
              <textarea id="seoDesc" rows={3} value={globalSeo.description} onChange={(e) => updateGlobal('description', e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
            </div>
            <div>
              <label htmlFor="seoKeywords" className="block text-sm font-medium text-gray-700">Keywords</label>
              <input id="seoKeywords" type="text" value={globalSeo.keywords} onChange={(e) => updateGlobal('keywords', e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">OG Image</label>
              <FileUpload
                value={globalSeo.ogImage}
                onChange={(url) => updateGlobal('ogImage', url)}
                accept="image/*"
              />
              {globalSeo.ogImage && (
                <p className="mt-1 text-xs text-gray-500 truncate">{globalSeo.ogImage}</p>
              )}
            </div>
            <div>
              <label htmlFor="canonicalUrl" className="block text-sm font-medium text-gray-700">Canonical URL</label>
              <input id="canonicalUrl" type="text" value={globalSeo.canonicalUrl} onChange={(e) => updateGlobal('canonicalUrl', e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
            </div>
          </div>
          <button
            onClick={() => void handleSaveGlobal()}
            disabled={saving}
            className="mt-4 rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Global SEO'}
          </button>
        </div>

        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Page-Specific SEO</h2>
          <div className="mt-4 space-y-3">
            {pages.map((page) => (
              <div key={page.id}>
                <div className="flex items-center justify-between rounded-brand border px-4 py-3">
                  <span className="font-mono text-sm font-medium">/{page.slug}</span>
                  <button
                    onClick={() => setEditingPage(editingPage === page.slug ? null : page.slug)}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    {editingPage === page.slug ? 'Close' : 'Configure'}
                  </button>
                </div>
                {editingPage === page.slug && (
                  <div className="ml-4 mt-2 space-y-3 border-l-2 border-brand-primary pb-2 pl-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Page Title</label>
                      <input
                        type="text"
                        value={page.meta_title ?? ''}
                        onChange={(e) => updatePageSeo(page.slug, 'meta_title', e.target.value)}
                        placeholder="Override default title"
                        className="mt-1 block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Page Description</label>
                      <textarea
                        rows={2}
                        value={page.meta_desc ?? ''}
                        onChange={(e) => updatePageSeo(page.slug, 'meta_desc', e.target.value)}
                        placeholder="Override default description"
                        className="mt-1 block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">OG Image</label>
                      <input
                        type="text"
                        value={page.og_image ?? ''}
                        onChange={(e) => updatePageSeo(page.slug, 'og_image', e.target.value)}
                        placeholder="https://..."
                        className="mt-1 block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={page.is_published}
                        onChange={(e) => updatePageSeo(page.slug, 'is_published', e.target.checked)}
                      />
                      Published
                    </label>
                    <button
                      onClick={() => void savePageSeo(page)}
                      className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                    >
                      Save Page SEO
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
