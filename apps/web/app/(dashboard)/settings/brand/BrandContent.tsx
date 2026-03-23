'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useUpdateWorkspace } from '@/lib/hooks/useWorkspaces';
import { useToast } from '@/providers/ToastProvider';
import { FileUpload } from '@/components/FileUpload';

export default function BrandContent() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const updateWorkspace = useUpdateWorkspace();
  const { addToast } = useToast();

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [primaryDarkColor, setPrimaryDarkColor] = useState('#4f46e5');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [headingFont, setHeadingFont] = useState('Inter');
  const [bodyFont, setBodyFont] = useState('Inter');

  const handleSave = () => {
    if (!activeWorkspaceId) return;
    // Save brand settings as avatar_url for logo (workspace-level)
    updateWorkspace.mutate(
      { id: activeWorkspaceId, avatar_url: logoUrl || undefined },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Brand settings saved.' }),
        onError: () => addToast({ type: 'error', message: 'Failed to save brand settings.' }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">Brand Settings</h1>
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
          Enterprise
        </span>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Logo */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Logo</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-brand border-2 border-dashed border-gray-300 overflow-hidden">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
              ) : (
                <span className="text-xs text-gray-400">Logo</span>
              )}
            </div>
            <div className="flex-1">
              <FileUpload
                label="Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                accept="image/*"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Colors</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="colorPrimary" className="block text-sm font-medium text-gray-700">Primary</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="colorPrimary"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-mono focus:border-brand-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="colorPrimaryDark" className="block text-sm font-medium text-gray-700">Primary Dark</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="colorPrimaryDark"
                  type="color"
                  value={primaryDarkColor}
                  onChange={(e) => setPrimaryDarkColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={primaryDarkColor}
                  onChange={(e) => setPrimaryDarkColor(e.target.value)}
                  className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-mono focus:border-brand-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="colorAccent" className="block text-sm font-medium text-gray-700">Accent</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="colorAccent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-mono focus:border-brand-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Typography</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="headingFont" className="block text-sm font-medium text-gray-700">Heading Font</label>
              <select
                id="headingFont"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
              >
                <option>Inter</option>
                <option>Poppins</option>
                <option>Roboto</option>
                <option>Montserrat</option>
                <option>Playfair Display</option>
              </select>
            </div>
            <div>
              <label htmlFor="bodyFont" className="block text-sm font-medium text-gray-700">Body Font</label>
              <select
                id="bodyFont"
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
              >
                <option>Inter</option>
                <option>Open Sans</option>
                <option>Lato</option>
                <option>Roboto</option>
                <option>Source Sans Pro</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateWorkspace.isPending}
          className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {updateWorkspace.isPending ? 'Saving...' : 'Save Brand Settings'}
        </button>
      </div>
    </div>
  );
}
