'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { RichTextEditor } from '@/components/RichTextEditor';

interface LegalDoc {
  id: string;
  slug: string;
  name: string;
  body: string;
  lastUpdated: string;
  status: 'published' | 'draft';
}

export function LegalContent() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<LegalDoc | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/cms/pages?type=legal');
      if (!res.ok) throw new Error('Failed to load legal pages');
      const data = (await res.json()) as { items?: LegalDoc[] };
      setDocs(data.items ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load legal pages';
      setError(msg);
      toast({ title: msg, variant: 'error' });
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = useCallback((doc: LegalDoc) => {
    setEditingDoc(doc);
    setEditedBody(doc.body ?? '');
  }, []);

  const handleBack = useCallback(() => {
    setEditingDoc(null);
    setEditedBody('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/cms/pages/${editingDoc.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editedBody }),
      });
      if (!res.ok) throw new Error('Failed to save legal page');
      toast({ title: 'Legal page saved', variant: 'success' });
      setEditingDoc(null);
      setEditedBody('');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast({ title: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [editingDoc, editedBody, toast, load]);

  const handleToggleStatus = useCallback(
    async (doc: LegalDoc) => {
      setToggling(doc.id);
      const newStatus = doc.status === 'published' ? 'draft' : 'published';
      try {
        const res = await fetch(`/api/v1/admin/cms/pages/${doc.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Failed to update status');
        toast({
          title: `Page ${newStatus === 'published' ? 'published' : 'moved to draft'}`,
          variant: 'success',
        });
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Status update failed';
        toast({ title: msg, variant: 'error' });
      } finally {
        setToggling(null);
      }
    },
    [toast, load],
  );

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
  if (error && docs.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Legal Content</h1>
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

  // Edit mode
  if (editingDoc) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-sm text-brand-primary hover:underline">
            &larr; Back to list
          </button>
          <h1 className="font-heading text-2xl font-bold">Edit: {editingDoc.name}</h1>
        </div>

        <div className="space-y-4 rounded-brand border bg-white p-6 shadow-sm">
          <RichTextEditor
            value={editedBody}
            onChange={setEditedBody}
            placeholder="Write the legal document content..."
            minHeight={400}
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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
      <h1 className="font-heading text-2xl font-bold">Legal Content</h1>
      <p className="text-sm text-gray-500">Manage legal documents and policies.</p>

      {docs.length === 0 ? (
        <div className="rounded-brand border bg-white p-8 text-center shadow-sm">
          <p className="text-gray-400">No legal documents found.</p>
        </div>
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <div className="divide-y">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-500">
                    Updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void handleToggleStatus(doc)}
                    disabled={toggling === doc.id}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: doc.status === 'published' ? '#16a34a' : '#d1d5db',
                    }}
                    title={doc.status === 'published' ? 'Click to unpublish' : 'Click to publish'}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                      style={{
                        transform: doc.status === 'published' ? 'translateX(22px)' : 'translateX(4px)',
                      }}
                    />
                  </button>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      doc.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <button
                    onClick={() => handleEdit(doc)}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    Edit
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
