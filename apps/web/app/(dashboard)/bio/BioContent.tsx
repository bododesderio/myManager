'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  useBioPages,
  useBioPageAnalytics,
  useCreateBioPage,
  useUpdateBioPage,
} from '@/lib/hooks/useBioPages';
import { FileUpload } from '@/components/FileUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useToast } from '@/providers/ToastProvider';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import styles from './BioContent.module.css';

interface BioLink {
  id: string;
  label: string;
  url: string;
}

const THEME_COLORS = [
  { name: 'Brand', value: 'brand-primary' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
];

export function BioContent() {
  const { data, isLoading } = useBioPages();
  const createBioPage = useCreateBioPage();
  const updateBioPage = useUpdateBioPage();
  const { addToast } = useToast();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const pages: any[] = (data as any)?.pages || (data as any) || [];
  const bioPage = pages.length > 0 ? pages[0] : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [links, setLinks] = useState<BioLink[]>([]);
  const [themeColor, setThemeColor] = useState('brand-primary');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);

  // Analytics
  const { data: analyticsData } = useBioPageAnalytics(bioPage?.id || '');
  const analytics: any = (analyticsData as any) || {};

  // Populate form from existing bio page
  useEffect(() => {
    if (bioPage) {
      setTitle(bioPage.title || bioPage.displayName || bioPage.display_name || '');
      setDescription(bioPage.description || bioPage.bio || '');
      setAvatarUrl(bioPage.avatarUrl || bioPage.avatar_url || '');
      setLinks(
        (bioPage.links || []).map((l: any, idx: number) => ({
          id: l.id || String(idx),
          label: l.label || l.title || '',
          url: l.url || '',
        })),
      );
      setThemeColor(bioPage.themeColor || bioPage.theme_color || 'brand-primary');
    }
  }, [bioPage]);

  function handleCreate() {
    createBioPage.mutate(
      { workspaceId, title: 'My Bio Page', description: '', links: [] },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Bio page created.' });
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to create bio page.' });
        },
      },
    );
  }

  function handleSave() {
    if (!bioPage) return;
    updateBioPage.mutate(
      {
        id: bioPage.id,
        title,
        description,
        avatarUrl,
        links,
        themeColor,
      },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Bio page saved successfully.' });
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to save bio page.' });
        },
      },
    );
  }

  function addLink() {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      addToast({ type: 'warning', message: 'Please fill in both label and URL.' });
      return;
    }
    setLinks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newLinkLabel, url: newLinkUrl },
    ]);
    setNewLinkLabel('');
    setNewLinkUrl('');
    setShowAddLink(false);
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function moveLink(index: number, direction: 'up' | 'down') {
    const newLinks = [...links];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks);
  }

  function updateLink(id: string, field: 'label' | 'url', value: string) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Bio Link Page</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a branded link-in-bio page for your profiles.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // No bio page yet - show create button
  if (!bioPage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Bio Link Page</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a branded link-in-bio page for your profiles.
          </p>
        </div>
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">
            No bio page yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a link-in-bio page to share all your important links in one place.
          </p>
          <button
            onClick={handleCreate}
            disabled={createBioPage.isPending}
            className="mt-4 inline-block rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {createBioPage.isPending ? 'Creating...' : 'Create Bio Page'}
          </button>
        </div>
      </div>
    );
  }

  // Bio page editor
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Bio Link Page</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a branded link-in-bio page for your profiles.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateBioPage.isPending}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {updateBioPage.isPending ? 'Saving...' : 'Publish Changes'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4">
          {/* Profile section */}
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Profile</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="bioTitle" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  id="bioTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="@myaccount"
                  className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="bioDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <RichTextEditor
                  value={description}
                  onChange={(html) => setDescription(html)}
                  placeholder="Digital creator & marketer"
                  minHeight={80}
                />
              </div>
              <FileUpload
                label="Avatar"
                value={avatarUrl}
                onChange={setAvatarUrl}
                accept="image/*"
              />
            </div>
          </div>

          {/* Links section */}
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Links</h2>
            <div className="mt-4 space-y-3">
              {links.map((link, index) => (
                <div key={link.id} className="rounded-brand border px-4 py-3">
                  {editingLinkId === link.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                        placeholder="Label"
                        className="block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder="URL"
                        className="block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                      />
                      <button
                        onClick={() => setEditingLinkId(null)}
                        className="text-xs font-medium text-brand-primary hover:underline"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveLink(index, 'up')}
                          disabled={index === 0}
                          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          &#9650;
                        </button>
                        <button
                          onClick={() => moveLink(index, 'down')}
                          disabled={index === links.length - 1}
                          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          &#9660;
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{link.label}</span>
                        <span className="ml-2 truncate text-sm text-gray-400">{link.url}</span>
                      </div>
                      <button
                        onClick={() => setEditingLinkId(link.id)}
                        className="text-xs text-brand-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {showAddLink ? (
                <div className="rounded-brand border border-dashed border-brand-primary p-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="Link label"
                      className="block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addLink}
                        className="rounded-brand bg-brand-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddLink(false);
                          setNewLinkLabel('');
                          setNewLinkUrl('');
                        }}
                        className="rounded-brand border px-3 py-1 text-xs font-medium transition hover:border-brand-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLink(true)}
                  className="w-full rounded-brand border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 transition hover:border-brand-primary hover:text-brand-primary"
                >
                  + Add Link
                </button>
              )}
            </div>
          </div>

          {/* Theme / Color picker */}
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Theme</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setThemeColor(color.value)}
                  className={`flex items-center gap-2 rounded-brand border px-3 py-2 text-sm transition ${
                    themeColor === color.value
                      ? 'border-brand-primary bg-brand-primary/5 font-medium text-brand-primary'
                      : 'hover:border-brand-primary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full ${styles.swatch}`}
                    style={{
                      ['--swatch-color' as string]:
                        color.value === 'brand-primary'
                          ? 'var(--color-brand-primary, #6366f1)'
                          : color.value,
                    } as React.CSSProperties}
                  />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Analytics</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-brand border p-4 text-center">
                <p className="text-2xl font-bold text-brand-primary">
                  {analytics.totalClicks ?? analytics.total_clicks ?? 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">Total Clicks</p>
              </div>
              <div className="rounded-brand border p-4 text-center">
                <p className="text-2xl font-bold text-brand-primary">{links.length}</p>
                <p className="mt-1 text-xs text-gray-500">Active Links</p>
              </div>
            </div>
            {(analytics.clicksPerLink || analytics.clicks_per_link) && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Clicks per Link</h3>
                {(analytics.clicksPerLink || analytics.clicks_per_link || []).map(
                  (entry: any) => (
                    <div
                      key={entry.linkId || entry.link_id || entry.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{entry.label || entry.url || '-'}</span>
                      <span className="font-medium">{entry.clicks ?? 0}</span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex justify-center lg:sticky lg:top-6 lg:self-start">
          <div className="w-80 rounded-brand border bg-white p-6 shadow-sm">
            <div className="text-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="mx-auto h-20 w-20 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="mx-auto h-20 w-20 rounded-full bg-brand-primary/10" />
              )}
              <h3 className="mt-4 font-heading font-bold">{title || '@myaccount'}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {description || 'Your bio goes here'}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {links.length === 0 ? (
                <p className="text-center text-sm text-gray-400">No links added yet.</p>
              ) : (
                links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-brand border border-brand-primary px-4 py-3 text-center text-sm font-medium text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    {link.label}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
