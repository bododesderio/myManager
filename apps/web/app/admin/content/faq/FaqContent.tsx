'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { RichTextEditor } from '@/components/RichTextEditor';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  is_visible: boolean;
  page: string | null;
}

function emptyItem() {
  return { question: '', answer: '', page: '' };
}

export function FaqContent() {
  const { toast } = useToast();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyItem());
  const [newItem, setNewItem] = useState<ReturnType<typeof emptyItem> | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/faq');
      if (!res.ok) throw new Error('Failed to load FAQ');
      const data = (await res.json()) as FaqItem[];
      setItems(data);
    } catch {
      toast({ title: 'Could not load FAQ items', variant: 'error' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order_index - b.order_index),
    [items],
  );

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setEditForm({
      question: item.question,
      answer: item.answer,
      page: item.page ?? '',
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/v1/admin/faq/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: editForm.question,
          answer: editForm.answer,
          page: editForm.page || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to update FAQ');
      const updated = (await res.json()) as FaqItem;
      setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
      toast({ title: 'FAQ updated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update FAQ', variant: 'error' });
    }
  }

  async function toggleVisibility(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    try {
      const res = await fetch(`/api/v1/admin/faq/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !item.is_visible }),
      });
      if (!res.ok) throw new Error('Failed to toggle FAQ visibility');
      const updated = (await res.json()) as FaqItem;
      setItems((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    } catch {
      toast({ title: 'Failed to update visibility', variant: 'error' });
    }
  }

  async function moveItem(id: string, direction: 'up' | 'down') {
    const current = [...sortedItems];
    const idx = current.findIndex((item) => item.id === id);
    const swapIndex = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIndex < 0 || swapIndex >= current.length) return;

    const source = current[idx];
    const target = current[swapIndex];

    try {
      const [sourceRes, targetRes] = await Promise.all([
        fetch(`/api/v1/admin/faq/${source.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: target.order_index }),
        }),
        fetch(`/api/v1/admin/faq/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: source.order_index }),
        }),
      ]);
      if (!sourceRes.ok || !targetRes.ok) throw new Error('Failed to reorder FAQ');
      await loadItems();
    } catch {
      toast({ title: 'Failed to reorder FAQ items', variant: 'error' });
    }
  }

  async function addItem() {
    if (!newItem || !newItem.question.trim() || !newItem.answer.trim()) return;
    try {
      const res = await fetch('/api/v1/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newItem.question,
          answer: newItem.answer,
          page: newItem.page || undefined,
          order_index: items.length,
          is_visible: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to create FAQ');
      const created = (await res.json()) as FaqItem;
      setItems((prev) => [...prev, created]);
      setNewItem(null);
      toast({ title: 'FAQ item added', variant: 'success' });
    } catch {
      toast({ title: 'Failed to add FAQ item', variant: 'error' });
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this FAQ item?')) return;
    try {
      const res = await fetch(`/api/v1/admin/faq/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete FAQ');
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: 'FAQ item deleted', variant: 'success' });
    } catch {
      toast({ title: 'Failed to delete FAQ item', variant: 'error' });
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-brand bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">FAQ Manager</h1>
          <p className="mt-1 text-sm text-gray-500">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setNewItem(emptyItem())}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Add New
        </button>
      </div>

      {newItem && (
        <div className="rounded-brand border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-6">
          <h3 className="mb-3 text-sm font-semibold">New FAQ Item</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Question</label>
              <input
                type="text"
                value={newItem.question}
                onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Answer</label>
              <RichTextEditor
                value={newItem.answer}
                onChange={(html) => setNewItem({ ...newItem, answer: html })}
                placeholder="Write the answer..."
                minHeight={120}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Page</label>
              <input
                type="text"
                value={newItem.page}
                onChange={(e) => setNewItem({ ...newItem, page: e.target.value })}
                className={inputCls}
                placeholder="pricing, support, onboarding..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addItem}
                className="rounded-brand bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Add
              </button>
              <button
                onClick={() => setNewItem(null)}
                className="rounded-brand border px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedItems.map((item, idx) => (
          <div
            key={item.id}
            className={`rounded-brand border bg-white shadow-sm ${
              !item.is_visible ? 'opacity-60' : ''
            }`}
          >
            {editingId === item.id ? (
              <div className="space-y-3 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Question</label>
                  <input
                    type="text"
                    value={editForm.question}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, question: e.target.value }))}
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Answer</label>
                  <RichTextEditor
                    value={editForm.answer}
                    onChange={(html) => setEditForm((prev) => ({ ...prev, answer: html }))}
                    placeholder="Write the answer..."
                    minHeight={120}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Page</label>
                  <input
                    type="text"
                    value={editForm.page}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, page: e.target.value }))}
                    className={inputCls}
                    placeholder="pricing, support, onboarding..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="rounded-brand bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-brand border px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 px-6 py-4">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => void moveItem(item.id, 'up')}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => void moveItem(item.id, 'down')}
                    disabled={idx === sortedItems.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => startEdit(item)}>
                  <p className="font-medium text-gray-900">{item.question}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.answer}</p>
                  {item.page && <p className="mt-2 text-xs text-gray-400">Page: {item.page}</p>}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => void toggleVisibility(item.id)}
                    className={`rounded p-1 transition hover:bg-gray-100 ${
                      item.is_visible ? 'text-gray-500' : 'text-gray-300'
                    }`}
                    title={item.is_visible ? 'Hide' : 'Show'}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => void deleteItem(item.id)}
                    className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-brand border bg-white py-12 text-center text-gray-400">
            No FAQ items found yet.
          </div>
        )}
      </div>
    </div>
  );
}
