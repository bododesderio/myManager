'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { FileUpload } from '@/components/FileUpload';
import { RichTextEditor } from '@/components/RichTextEditor';

interface BlogForm {
  title: string;
  slug: string;
  category: string;
  tags: string;
  excerpt: string;
  cover_image: string;
  body: string;
  is_published: boolean;
  published_at: string;
  is_featured: boolean;
  meta_title: string;
  meta_desc: string;
  og_image: string;
}

const EMPTY_FORM: BlogForm = {
  title: '',
  slug: '',
  category: 'General',
  tags: '',
  excerpt: '',
  cover_image: '',
  body: '',
  is_published: false,
  published_at: '',
  is_featured: false,
  meta_title: '',
  meta_desc: '',
  og_image: '',
};

const FALLBACK_CATEGORIES = ['General', 'Guides', 'Tips', 'Product', 'Engineering', 'Case Studies'];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function BlogEditorContent({ postId }: { postId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [mdPreview, setMdPreview] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!postId);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/v1/admin/blog/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      } catch {
        // Keep fallback categories
      }
    }
    void fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/blog/${postId}`);
      if (!res.ok) throw new Error('Failed to load blog post');
      const data = await res.json();
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        category: data.category || 'General',
        tags: (data.tags || []).join(', '),
        excerpt: data.excerpt || '',
        cover_image: data.cover_image || '',
        body: data.body || '',
        is_published: data.is_published || false,
        published_at: data.published_at ? data.published_at.slice(0, 16) : '',
        is_featured: data.is_featured || false,
        meta_title: data.meta_title || '',
        meta_desc: data.meta_desc || '',
        og_image: data.og_image || '',
      });
      setAutoSlug(false);
    } catch {
      toast({ title: 'Could not load blog post', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  function update(field: keyof BlogForm, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && autoSlug && typeof value === 'string') {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };

      const res = await fetch(postId ? `/api/v1/admin/blog/${postId}` : '/api/v1/admin/blog', {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save blog post');
      const data = await res.json();
      toast({ title: postId ? 'Post updated' : 'Post created', variant: 'success' });
      if (!postId) {
        router.push(`/admin/content/blog/${data.id}` as Route);
      }
    } catch {
      toast({ title: 'Failed to save post', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-brand bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={'/admin/content/blog' as Route} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-heading text-2xl font-bold">{postId ? 'Edit Post' : 'New Post'}</h1>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} className={inputCls} placeholder="Post title..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      update('slug', e.target.value);
                    }}
                    className={`${inputCls} flex-1`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                <RichTextEditor
                  value={form.excerpt}
                  onChange={(html) => update('excerpt', html)}
                  placeholder="Short summary..."
                  minHeight={80}
                />
              </div>
              <FileUpload
                label="Cover Image"
                value={form.cover_image}
                onChange={(url) => update('cover_image', url)}
                accept="image/*"
              />
            </div>
          </div>

          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-gray-700">Body</label>
            <RichTextEditor
              value={form.body}
              onChange={(html) => update('body', html)}
              placeholder="Write your blog post..."
              minHeight={300}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h3 className="font-heading text-sm font-semibold">Publish Settings</h3>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between text-sm text-gray-700">
                Published
                <input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} />
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700">Published At</label>
                <input type="datetime-local" value={form.published_at} onChange={(e) => update('published_at', e.target.value)} className={inputCls} />
              </div>
              <label className="flex items-center justify-between text-sm text-gray-700">
                Featured
                <input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h3 className="font-heading text-sm font-semibold">Organization</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select value={form.category} onChange={(e) => update('category', e.target.value)} className={inputCls}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <input type="text" value={form.tags} onChange={(e) => update('tags', e.target.value)} className={inputCls} placeholder="tag1, tag2, tag3" />
              </div>
            </div>
          </div>

          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h3 className="font-heading text-sm font-semibold">SEO</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                <input type="text" value={form.meta_title} onChange={(e) => update('meta_title', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea rows={2} value={form.meta_desc} onChange={(e) => update('meta_desc', e.target.value)} className={inputCls} />
              </div>
              <FileUpload
                label="OG Image"
                value={form.og_image}
                onChange={(url) => update('og_image', url)}
                accept="image/*"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
