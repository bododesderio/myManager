'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkspace, useUpdateWorkspace } from '@/lib/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useToast } from '@/providers/ToastProvider';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function WorkspaceSettingsContent() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: workspace, isLoading } = useWorkspace(activeWorkspaceId);
  const updateWorkspace = useUpdateWorkspace();
  const { addToast } = useToast();

  const ws = workspace as any;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (ws) {
      setName(ws.name ?? '');
      setSlug(ws.slug ?? '');
      setDescription(ws.description ?? '');
    }
  }, [ws]);

  const errors = {
    name: name.trim().length < 2 ? 'Workspace name must be at least 2 characters.' : '',
    slug:
      !/^[a-z0-9-]{2,}$/.test(slug)
        ? 'Slug must be lowercase letters, numbers, and dashes (min 2 chars).'
        : '',
  };
  const isValid = !errors.name && !errors.slug;

  const handleSave = () => {
    if (!activeWorkspaceId) return;
    if (!isValid) {
      addToast({ type: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    updateWorkspace.mutate(
      { id: activeWorkspaceId, name: name.trim(), slug: slug.trim(), description } as any,
      {
        onSuccess: () => addToast({ type: 'success', message: 'Workspace updated successfully.' }),
        onError: () => addToast({ type: 'error', message: 'Failed to update workspace.' }),
      },
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading workspace...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Workspace Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">General</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="wsName" className="block text-sm font-medium text-gray-700">
                Workspace Name <span className="text-red-500">*</span>
              </label>
              <input
                id="wsName"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 block w-full rounded-brand border px-4 py-2 focus:outline-none ${
                  errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="wsSlug" className="block text-sm font-medium text-gray-700">
                Workspace URL <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-500">mymanager.app/</span>
                <input
                  id="wsSlug"
                  type="text"
                  required
                  pattern="[a-z0-9\-]+"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={`block flex-1 rounded-brand border px-4 py-2 focus:outline-none ${
                    errors.slug ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'
                  }`}
                />
              </div>
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
            </div>
            <div>
              <label htmlFor="wsDesc" className="block text-sm font-medium text-gray-700">Description</label>
              <RichTextEditor
                value={description}
                onChange={(html) => setDescription(html)}
                placeholder="A brief description of your workspace"
                minHeight={100}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateWorkspace.isPending || !isValid}
            className="mt-6 rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {updateWorkspace.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
