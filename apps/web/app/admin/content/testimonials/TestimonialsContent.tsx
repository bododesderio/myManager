'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_initials: string;
  author_avatar_color: string;
  company: string;
  quote: string;
  rating: number;
  placement: string;
  order_index: number;
  is_visible: boolean;
}

const PLACEMENTS = ['landing', 'pricing', 'about', 'features'];

function emptyTestimonial(order_index: number): Omit<Testimonial, 'id'> {
  return {
    author_name: '',
    author_role: '',
    author_initials: '',
    author_avatar_color: '#6366f1',
    company: '',
    quote: '',
    rating: 5,
    placement: 'landing',
    order_index,
    is_visible: true,
  };
}

export function TestimonialsContent() {
  const { toast } = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Testimonial | (Omit<Testimonial, 'id'> & { id: null }) | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/testimonials');
      if (!res.ok) throw new Error('Failed to load testimonials');
      const data = (await res.json()) as Testimonial[];
      setItems(data);
    } catch {
      toast({ title: 'Could not load testimonials', variant: 'error' });
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

  async function saveItem() {
    if (!editItem) return;
    const isNew = !editItem.id;
    const payload = {
      author_name: editItem.author_name,
      author_role: editItem.author_role,
      author_initials: editItem.author_initials,
      author_avatar_color: editItem.author_avatar_color,
      company: editItem.company,
      quote: editItem.quote,
      rating: editItem.rating,
      placement: editItem.placement,
      order_index: editItem.order_index,
      is_visible: editItem.is_visible,
    };

    try {
      const res = await fetch(
        isNew ? '/api/v1/admin/testimonials' : `/api/v1/admin/testimonials/${editItem.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error('Failed to save testimonial');
      await loadItems();
      setEditItem(null);
      toast({ title: isNew ? 'Testimonial added' : 'Testimonial updated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save testimonial', variant: 'error' });
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/v1/admin/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete testimonial');
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: 'Testimonial deleted', variant: 'success' });
    } catch {
      toast({ title: 'Failed to delete testimonial', variant: 'error' });
    }
  }

  function openNewModal() {
    setEditItem({ id: null, ...emptyTestimonial(items.length) });
  }

  const inputCls =
    'mt-1 block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-brand bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Testimonials</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer testimonials</p>
        </div>
        <button
          onClick={openNewModal}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-brand border bg-white p-5 shadow-sm ${
              !item.is_visible ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: item.author_avatar_color }}
                >
                  {item.author_initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.author_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.author_role}
                    {item.company ? ` at ${item.company}` : ''}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {item.placement}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-gray-700">&ldquo;{item.quote}&rdquo;</p>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${i < item.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="mt-4 flex gap-2 border-t pt-3">
              <button
                onClick={() => setEditItem(item)}
                className="text-xs text-brand-primary hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => void deleteItem(item.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full rounded-brand border bg-white py-12 text-center text-gray-400">
            No testimonials yet.
          </div>
        )}
      </div>

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-brand bg-white p-6 shadow-xl">
            <h2 className="font-heading text-lg font-semibold">
              {editItem.id ? 'Edit Testimonial' : 'New Testimonial'}
            </h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author Name</label>
                  <input
                    type="text"
                    value={editItem.author_name}
                    onChange={(e) => setEditItem({ ...editItem, author_name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    value={editItem.author_role}
                    onChange={(e) => setEditItem({ ...editItem, author_role: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initials</label>
                  <input
                    type="text"
                    value={editItem.author_initials}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        author_initials: e.target.value.toUpperCase().slice(0, 3),
                      })
                    }
                    className={inputCls}
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Avatar Color</label>
                  <input
                    type="color"
                    value={editItem.author_avatar_color}
                    onChange={(e) =>
                      setEditItem({ ...editItem, author_avatar_color: e.target.value })
                    }
                    className="mt-1 h-[38px] w-full cursor-pointer rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    value={editItem.company}
                    onChange={(e) => setEditItem({ ...editItem, company: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quote</label>
                <textarea
                  rows={3}
                  value={editItem.quote}
                  onChange={(e) => setEditItem({ ...editItem, quote: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <select
                    value={editItem.rating}
                    onChange={(e) => setEditItem({ ...editItem, rating: Number(e.target.value) })}
                    className={inputCls}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Placement</label>
                  <select
                    value={editItem.placement}
                    onChange={(e) => setEditItem({ ...editItem, placement: e.target.value })}
                    className={inputCls}
                  >
                    {PLACEMENTS.map((placement) => (
                      <option key={placement} value={placement}>
                        {placement}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setEditItem({ ...editItem, is_visible: !editItem.is_visible })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        editItem.is_visible ? 'bg-brand-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                          editItem.is_visible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    Visible
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditItem(null)}
                className="rounded-brand border px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void saveItem()}
                className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
