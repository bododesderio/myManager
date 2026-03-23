'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  placement: string;
  order_index: number;
  is_visible: boolean;
  is_external: boolean;
}

type EditableNavLink = Omit<NavLinkItem, 'id'> & { id: string | null };

const PLACEMENTS = [
  { key: 'main_nav', label: 'Main Navigation' },
  { key: 'footer_product', label: 'Footer - Product' },
  { key: 'footer_company', label: 'Footer - Company' },
];

function emptyLink(placement: string, order_index: number) {
  return {
    id: null as string | null,
    label: '',
    href: '',
    placement,
    order_index,
    is_visible: true,
    is_external: false,
  };
}

export function NavLinksContent() {
  const { toast } = useToast();
  const [links, setLinks] = useState<NavLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<EditableNavLink | null>(null);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/cms/nav-links');
      if (!res.ok) throw new Error('Failed to load navigation links');
      const data = (await res.json()) as NavLinkItem[];
      setLinks(data);
    } catch {
      toast({ title: 'Could not load navigation links', variant: 'error' });
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const linksByPlacement = useMemo(() => {
    return PLACEMENTS.map((group) => ({
      ...group,
      links: links
        .filter((link) => link.placement === group.key)
        .sort((a, b) => a.order_index - b.order_index),
    }));
  }, [links]);

  async function moveItem(id: string, placement: string, direction: 'up' | 'down') {
    const group = links
      .filter((link) => link.placement === placement)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = group.findIndex((link) => link.id === id);
    const swapIndex = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIndex < 0 || swapIndex >= group.length) return;

    const source = group[idx];
    const target = group[swapIndex];

    try {
      const [sourceRes, targetRes] = await Promise.all([
        fetch(`/api/v1/admin/cms/nav-links/${source.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: target.order_index }),
        }),
        fetch(`/api/v1/admin/cms/nav-links/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: source.order_index }),
        }),
      ]);
      if (!sourceRes.ok || !targetRes.ok) throw new Error('Failed to reorder navigation');
      await loadLinks();
    } catch {
      toast({ title: 'Failed to reorder links', variant: 'error' });
    }
  }

  async function toggleVisibility(link: NavLinkItem) {
    try {
      const res = await fetch(`/api/v1/admin/cms/nav-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !link.is_visible }),
      });
      if (!res.ok) throw new Error('Failed to update nav link');
      const updated = (await res.json()) as NavLinkItem;
      setLinks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      toast({ title: 'Failed to update visibility', variant: 'error' });
    }
  }

  async function saveItem() {
    if (!editItem) return;
    const isNew = !editItem.id;
    const payload = {
      label: editItem.label,
      href: editItem.href,
      placement: editItem.placement,
      order_index: editItem.order_index,
      is_visible: editItem.is_visible,
      is_external: editItem.is_external || /^https?:\/\//.test(editItem.href),
    };

    try {
      const res = await fetch(
        isNew ? '/api/v1/admin/cms/nav-links' : `/api/v1/admin/cms/nav-links/${editItem.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error('Failed to save nav link');
      await loadLinks();
      setEditItem(null);
      toast({ title: isNew ? 'Link added' : 'Link updated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save link', variant: 'error' });
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this nav link?')) return;
    try {
      const res = await fetch(`/api/v1/admin/cms/nav-links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete nav link');
      setLinks((prev) => prev.filter((link) => link.id !== id));
      toast({ title: 'Link deleted', variant: 'success' });
    } catch {
      toast({ title: 'Failed to delete link', variant: 'error' });
    }
  }

  function openNew(placement: string) {
    const count = links.filter((link) => link.placement === placement).length;
    setEditItem(emptyLink(placement, count));
  }

  const inputCls =
    'mt-1 block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-brand bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Nav Links</h1>
        <p className="mt-1 text-sm text-gray-500">Manage navigation links by placement group</p>
      </div>

      {linksByPlacement.map((group) => (
        <div key={group.key} className="rounded-brand border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <h2 className="font-heading text-base font-semibold">{group.label}</h2>
            <button
              onClick={() => openNew(group.key)}
              className="rounded-brand bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/20"
            >
              + Add
            </button>
          </div>
          {group.links.length === 0 ? (
            <div className="px-6 py-6 text-center text-sm text-gray-400">No links in this group.</div>
          ) : (
            <div className="divide-y">
              {group.links.map((link, idx) => (
                <div
                  key={link.id}
                  className={`flex items-center gap-4 px-6 py-3 ${!link.is_visible ? 'opacity-50' : ''}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => void moveItem(link.id, group.key, 'up')}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => void moveItem(link.id, group.key, 'down')}
                      disabled={idx === group.links.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{link.label}</span>
                    <span className="ml-2 font-mono text-xs text-gray-400">{link.href}</span>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => void toggleVisibility(link)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100"
                      title={link.is_visible ? 'Hide' : 'Show'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditItem({ ...link })}
                      className="text-xs text-brand-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => void deleteItem(link.id)} className="text-xs text-red-500 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-brand bg-white p-6 shadow-xl">
            <h2 className="font-heading text-lg font-semibold">{editItem.id ? 'Edit Link' : 'New Link'}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Label</label>
                <input
                  type="text"
                  value={editItem.label}
                  onChange={(e) => setEditItem({ ...editItem, label: e.target.value })}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL / Href</label>
                <input
                  type="text"
                  value={editItem.href}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      href: e.target.value,
                      is_external: /^https?:\/\//.test(e.target.value),
                    })
                  }
                  className={inputCls}
                  placeholder="/path or https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Placement</label>
                <select
                  value={editItem.placement}
                  onChange={(e) => setEditItem({ ...editItem, placement: e.target.value })}
                  className={inputCls}
                >
                  {PLACEMENTS.map((placement) => (
                    <option key={placement.key} value={placement.key}>
                      {placement.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editItem.is_visible}
                  onChange={(e) => setEditItem({ ...editItem, is_visible: e.target.checked })}
                />
                Visible
              </label>
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
