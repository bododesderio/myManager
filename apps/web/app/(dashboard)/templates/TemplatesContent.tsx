'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTemplates, useDeleteTemplate } from '@/lib/hooks/useTemplates';
import { useToast } from '@/providers/ToastProvider';
import { CardGridSkeleton } from '@/components/skeletons/CardSkeleton';

const PLATFORM_BADGES: Record<string, string> = {
  twitter: 'bg-sky-100 text-sky-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-blue-100 text-blue-800',
  tiktok: 'bg-gray-100 text-gray-800',
  youtube: 'bg-red-100 text-red-700',
};

export function TemplatesContent() {
  const { data, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const { addToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const templates = (data as any)?.templates || (data as any) || [];

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteTemplate.mutate(deletingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Template deleted.' });
        setDeletingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete template.' });
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Post Templates</h1>
          <p className="mt-1 text-sm text-gray-500">Reusable templates to speed up content creation.</p>
        </div>
        <Link
          href="/compose?newTemplate=true"
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Create Template
        </Link>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : !Array.isArray(templates) || templates.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">No templates yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create reusable templates to speed up your workflow.</p>
          <Link
            href="/compose?newTemplate=true"
            className="mt-4 inline-block rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Create Your First Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: any) => {
            const platforms: string[] = template.platforms || [];
            const name = template.name || template.title || 'Untitled';
            const description = template.description || '';

            return (
              <div
                key={template.id}
                className="group rounded-brand border bg-white p-5 shadow-sm transition hover:border-brand-primary"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-heading font-semibold">{name}</h3>
                </div>
                {description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{description}</p>
                )}
                {platforms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {platforms.map((p: string) => (
                      <span
                        key={p}
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${PLATFORM_BADGES[p] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/compose?templateId=${template.id}`}
                    className="rounded-brand bg-brand-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-primary-dark"
                  >
                    Use
                  </Link>
                  <Link
                    href={`/compose?templateId=${template.id}&edit=true`}
                    className="rounded-brand border px-3 py-1 text-xs font-medium transition hover:border-brand-primary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded-brand border px-3 py-1 text-xs font-medium text-red-500 transition hover:border-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Delete Template</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTemplate.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTemplate.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
