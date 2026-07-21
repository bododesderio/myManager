'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Card } from '@mymanager/ui';
import { apiClient } from '@/lib/api/client';

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
      const data = await apiClient.get<{ items?: LegalDoc[] }>('/admin/cms/pages?type=legal');
      setDocs(data.items ?? []);
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || 'Could not load legal pages';
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
      await apiClient.patch(`/admin/cms/pages/${editingDoc.slug}`, { body: editedBody });
      toast({ title: 'Legal page saved', variant: 'success' });
      setEditingDoc(null);
      setEditedBody('');
      await load();
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || 'Save failed';
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
        await apiClient.patch(`/admin/cms/pages/${doc.slug}`, { status: newStatus });
        toast({
          title: `Page ${newStatus === 'published' ? 'published' : 'moved to draft'}`,
          variant: 'success',
        });
        await load();
      } catch (err: any) {
        const msg = err?.message || err?.error?.message || 'Status update failed';
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
        <div className="h-8 w-48 animate-pulse rounded bg-border" />
        <div className="h-64 animate-pulse rounded-brand bg-bg-2" />
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
          <button onClick={handleBack} className="text-sm text-primary hover:underline">
            &larr; Back to list
          </button>
          <h1 className="font-heading text-2xl font-bold">Edit: {editingDoc.name}</h1>
        </div>

        <Card className="space-y-4">
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
              className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleBack}
              className="rounded-brand border border-border px-4 py-2 text-sm font-semibold text-text-2 transition hover:bg-bg-2"
            >
              Cancel
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // List mode
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Legal Content</h1>
      <p className="text-sm text-text-2">Manage legal documents and policies.</p>

      {docs.length === 0 ? (
        <Card padding="none" className="p-8 text-center">
          <p className="text-text-muted">No legal documents found.</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-bg-2">
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-text-2">
                    Updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void handleToggleStatus(doc)}
                    disabled={toggling === doc.id}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
                      doc.status === 'published' ? 'bg-green-600' : 'bg-border'
                    }`}
                    title={doc.status === 'published' ? 'Click to unpublish' : 'Click to publish'}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-bg shadow transition-transform ${
                        doc.status === 'published' ? 'translate-x-[22px]' : 'translate-x-1'
                      }`}
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
                    className="text-sm text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
