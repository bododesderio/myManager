'use client';

import { useCallback, useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useToast } from '@/providers/ToastProvider';
import { RichTextEditor } from '@/components/RichTextEditor';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  body: string;
  lastEdited: string;
}

type EditorMode = 'list' | 'create' | 'edit' | 'preview';

export function EmailTemplatesContent() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('list');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/email-templates');
      if (!res.ok) throw new Error('Failed to load email templates');
      const data = (await res.json()) as { items?: EmailTemplate[] };
      setTemplates(data.items ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load email templates';
      setError(msg);
      toast({ title: msg, variant: 'error' });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(() => {
    setEditingTemplate({ name: '', subject: '', trigger: '', body: '' });
    setMode('create');
  }, []);

  const handleEdit = useCallback((template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setMode('edit');
  }, []);

  const handlePreview = useCallback((template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setMode('preview');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const isCreate = mode === 'create';
      const url = isCreate
        ? '/api/v1/admin/email-templates'
        : `/api/v1/admin/email-templates/${editingTemplate.id}`;
      const method = isCreate ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          trigger: editingTemplate.trigger,
          body: editingTemplate.body,
        }),
      });

      if (!res.ok) throw new Error(`Failed to ${isCreate ? 'create' : 'update'} template`);

      toast({ title: `Template ${isCreate ? 'created' : 'updated'} successfully`, variant: 'success' });
      setMode('list');
      setEditingTemplate({});
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast({ title: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [mode, editingTemplate, toast, load]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this template?')) return;
      setDeleting(id);
      try {
        const res = await fetch(`/api/v1/admin/email-templates/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete template');
        toast({ title: 'Template deleted', variant: 'success' });
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Delete failed';
        toast({ title: msg, variant: 'error' });
      } finally {
        setDeleting(null);
      }
    },
    [toast, load],
  );

  const handleBack = useCallback(() => {
    setMode('list');
    setEditingTemplate({});
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-brand bg-gray-100" />
      </div>
    );
  }

  // Error state
  if (error && templates.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Email Templates</h1>
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

  // Preview mode
  if (mode === 'preview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-sm text-brand-primary hover:underline">
            &larr; Back to list
          </button>
          <h1 className="font-heading text-2xl font-bold">Preview: {editingTemplate.name}</h1>
        </div>
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Subject: {editingTemplate.subject}</p>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editingTemplate.body ?? '') }}
          />
        </div>
      </div>
    );
  }

  // Create / Edit mode
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-sm text-brand-primary hover:underline">
            &larr; Back to list
          </button>
          <h1 className="font-heading text-2xl font-bold">
            {mode === 'create' ? 'New Template' : `Edit: ${editingTemplate.name}`}
          </h1>
        </div>

        <div className="space-y-4 rounded-brand border bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Template Name</label>
            <input
              type="text"
              value={editingTemplate.name ?? ''}
              onChange={(e) => setEditingTemplate((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-brand border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="e.g. Welcome Email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject Line</label>
            <input
              type="text"
              value={editingTemplate.subject ?? ''}
              onChange={(e) => setEditingTemplate((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full rounded-brand border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="e.g. Welcome to {{appName}}"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trigger</label>
            <input
              type="text"
              value={editingTemplate.trigger ?? ''}
              onChange={(e) => setEditingTemplate((prev) => ({ ...prev, trigger: e.target.value }))}
              className="w-full rounded-brand border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="e.g. On signup"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Body</label>
            <RichTextEditor
              value={editingTemplate.body ?? ''}
              onChange={(html) => setEditingTemplate((prev) => ({ ...prev, body: html }))}
              placeholder="Write your email body here..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
            </button>
            <button
              onClick={handleBack}
              className="rounded-brand border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Email Templates</h1>
        <button
          onClick={handleCreate}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-brand border bg-white p-8 text-center shadow-sm">
          <p className="text-gray-400">No email templates yet.</p>
          <button
            onClick={handleCreate}
            className="mt-3 text-sm font-semibold text-brand-primary hover:underline"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <div className="divide-y">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-gray-500">
                    Trigger: {template.trigger} &middot; Edited {template.lastEdited}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handlePreview(template)}
                    className="text-sm text-gray-400 hover:underline"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => void handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="text-sm text-red-500 hover:underline disabled:opacity-50"
                  >
                    {deleting === template.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
