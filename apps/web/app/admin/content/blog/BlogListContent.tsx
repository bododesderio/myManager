'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
}

export function BlogListContent() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/blog');
      if (!res.ok) throw new Error('Failed to load blog posts');
      const data = (await res.json()) as { data?: BlogPost[] };
      setPosts(data.data ?? []);
    } catch {
      toast({ title: 'Could not load blog posts', variant: 'error' });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this blog post?')) return;
    try {
      const res = await fetch(`/api/v1/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete blog post');
      setPosts((prev) => prev.filter((post) => post.id !== id));
      toast({ title: 'Post deleted', variant: 'success' });
    } catch {
      toast({ title: 'Failed to delete post', variant: 'error' });
    }
  }

  function formatDate(value: string | null) {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Blog Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage live blog articles</p>
        </div>
        <Link
          href={'/admin/content/blog/new' as Route}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          New Post
        </Link>
      </div>

      <div className="overflow-hidden rounded-brand border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/admin/content/blog/${post.id}` as Route} className="font-medium text-gray-900 hover:text-brand-primary">
                    {post.title}
                  </Link>
                  <p className="font-mono text-xs text-gray-400">/{post.slug}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {post.category}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-500">{formatDate(post.published_at)}</td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/admin/content/blog/${post.id}` as Route} className="text-sm text-brand-primary hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => void handleDelete(post.id)} className="ml-3 text-sm text-red-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No blog posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
