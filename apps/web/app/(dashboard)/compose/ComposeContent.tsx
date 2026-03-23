'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { useSocialAccounts } from '@/lib/hooks/useSocialAccounts';
import { useCreatePost, usePublishPost } from '@/lib/hooks/usePosts';
import { useUploadMedia } from '@/lib/hooks/useMedia';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useToast } from '@/providers/ToastProvider';

/* ------------------------------------------------------------------ */
/*  Platform character limits                                          */
/* ------------------------------------------------------------------ */
const PLATFORM_LIMITS: Record<string, number> = {
  facebook: 63206,
  instagram: 2200,
  x: 280,
  twitter: 280,
  linkedin: 3000,
  tiktok: 2200,
  threads: 500,
  pinterest: 500,
  youtube: 5000,
};

function getActiveCharLimit(selectedPlatforms: string[]): number {
  if (selectedPlatforms.length === 0) return 2200; // sensible default
  return Math.min(
    ...selectedPlatforms.map(
      (p) => PLATFORM_LIMITS[p.toLowerCase()] ?? 2200,
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  Platform icon helper (simple coloured dot + label fallback)        */
/* ------------------------------------------------------------------ */
const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-500',
  x: 'bg-black',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-gray-900',
  threads: 'bg-gray-800',
  pinterest: 'bg-red-600',
  youtube: 'bg-red-500',
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SocialAccount {
  id: string;
  platform: string;
  display_name: string;
  platform_username: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface UploadedMedia {
  id: string;
  url: string;
  name: string;
}

type SubmitMode = 'publish' | 'schedule' | 'draft';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ComposeContent() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { addToast } = useToast();

  /* --- Data hooks --- */
  const { data: accountsData, isLoading: accountsLoading } = useSocialAccounts();
  const createPost = useCreatePost();
  const publishPost = usePublishPost();
  const uploadMedia = useUploadMedia();

  /* --- Local state --- */
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [submitMode, setSubmitMode] = useState<SubmitMode>('publish');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* --- Derived --- */
  const accounts: SocialAccount[] = (accountsData as any)?.data ?? (accountsData as any) ?? [];
  const activeAccounts = accounts.filter((a) => a.is_active);
  const selectedPlatforms = activeAccounts
    .filter((a) => selectedAccountIds.has(a.id))
    .map((a) => a.platform);
  const charLimit = getActiveCharLimit(selectedPlatforms);

  /* --- Handlers --- */
  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      for (const file of Array.from(files)) {
        try {
          const result: any = await uploadMedia.mutateAsync(file);
          const media = result?.data ?? result;
          setUploadedMedia((prev) => [
            ...prev,
            { id: media.id, url: media.url ?? media.file_url ?? '', name: file.name },
          ]);
        } catch {
          addToast({ type: 'error', message: `Failed to upload ${file.name}` });
        }
      }
    },
    [uploadMedia, addToast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [handleFileUpload],
  );

  const removeMedia = (id: string) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (mode: SubmitMode) => {
    if (!activeWorkspaceId) {
      addToast({ type: 'error', message: 'No workspace selected.' });
      return;
    }
    if (selectedAccountIds.size === 0) {
      addToast({ type: 'error', message: 'Select at least one account.' });
      return;
    }
    if (!caption.trim() && uploadedMedia.length === 0) {
      addToast({ type: 'error', message: 'Add some content or media before posting.' });
      return;
    }
    if (mode === 'schedule' && !scheduledAt) {
      addToast({ type: 'error', message: 'Pick a date and time for scheduling.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        workspaceId: activeWorkspaceId,
        caption,
        platforms: selectedPlatforms,
        contentType: uploadedMedia.length > 0 ? 'media' : 'text',
        mediaIds: uploadedMedia.map((m) => m.id),
      };

      if (mode === 'schedule') {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const created: any = await createPost.mutateAsync(payload);
      const postId: string = created?.data?.id ?? created?.id;

      if (mode === 'publish' && postId) {
        await publishPost.mutateAsync(postId);
        addToast({ type: 'success', message: 'Post published successfully!' });
      } else if (mode === 'schedule') {
        addToast({ type: 'success', message: 'Post scheduled successfully!' });
      } else {
        addToast({ type: 'success', message: 'Draft saved.' });
      }

      // Reset form
      setCaption('');
      setSelectedAccountIds(new Set());
      setUploadedMedia([]);
      setScheduledAt('');
      setSubmitMode('publish');
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err?.response?.data?.message ?? err?.message ?? 'Something went wrong.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ==================== LEFT: Composer ==================== */}
      <div className="lg:col-span-2 space-y-4">
        {/* --- Account Selection --- */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-gray-700">Select Accounts</h2>

          {accountsLoading && (
            <p className="mt-3 text-sm text-gray-400">Loading accounts...</p>
          )}

          {!accountsLoading && activeAccounts.length === 0 && (
            <p className="mt-3 text-sm text-gray-400">
              No connected accounts found. Connect one in Settings.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {activeAccounts.map((account) => {
              const selected = selectedAccountIds.has(account.id);
              const colorDot =
                PLATFORM_COLORS[account.platform.toLowerCase()] ?? 'bg-gray-500';
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => toggleAccount(account.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
                    selected
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                      : 'border-gray-300 hover:border-brand-primary hover:text-brand-primary'
                  }`}
                >
                  {account.avatar_url ? (
                    <Image
                      src={account.avatar_url}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className={`inline-block h-3 w-3 rounded-full ${colorDot}`} />
                  )}
                  <span>{account.display_name || account.platform_username}</span>
                  <span className="text-xs text-gray-400 capitalize">
                    {account.platform}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Content Textarea --- */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <label htmlFor="compose-caption" className="block text-sm font-semibold text-gray-700">
            Content
          </label>
          <textarea
            id="compose-caption"
            rows={6}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What would you like to share?"
            className="mt-2 block w-full resize-none rounded-brand border border-gray-300 px-4 py-3 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span
              className={
                caption.length > charLimit ? 'font-semibold text-red-600' : 'text-gray-500'
              }
            >
              {caption.length.toLocaleString()} / {charLimit.toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* --- Media Upload --- */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-gray-700">Media</h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-brand border-2 border-dashed px-6 py-8 transition ${
              isDragging
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-gray-300 hover:border-brand-primary'
            }`}
          >
            <svg
              className="mb-2 h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M6.75 12l-1.72-1.72a1.5 1.5 0 010-2.12L12 1.5l6.97 6.66a1.5 1.5 0 010 2.12L17.25 12"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Drag &amp; drop files here, or{' '}
              <span className="font-medium text-brand-primary">browse</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {uploadMedia.isPending && (
            <p className="mt-2 text-xs text-gray-400">Uploading...</p>
          )}

          {uploadedMedia.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {uploadedMedia.map((m) => (
                <div
                  key={m.id}
                  className="group relative h-20 w-20 overflow-hidden rounded-brand border"
                >
                  {m.url ? (
                    <Image
                      src={m.url}
                      alt={m.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                      {m.name.slice(0, 8)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(m.id)}
                    className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/60 px-1 text-xs text-white group-hover:block"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Schedule / Submit --- */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-gray-700">Schedule</h2>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSubmitMode('publish');
                handleSubmit('publish');
              }}
              className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {isSubmitting && submitMode === 'publish' ? 'Publishing...' : 'Publish Now'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (submitMode !== 'schedule') {
                  setSubmitMode('schedule');
                  return;
                }
                handleSubmit('schedule');
              }}
              className={`rounded-brand border px-6 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                submitMode === 'schedule'
                  ? 'border-brand-primary bg-brand-primary text-white hover:bg-brand-primary-dark'
                  : 'border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white'
              }`}
            >
              {isSubmitting && submitMode === 'schedule' ? 'Scheduling...' : 'Schedule'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSubmitMode('draft');
                handleSubmit('draft');
              }}
              className="rounded-brand border px-6 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-400 disabled:opacity-50"
            >
              {isSubmitting && submitMode === 'draft' ? 'Saving...' : 'Save Draft'}
            </button>
          </div>

          {submitMode === 'schedule' && (
            <div className="mt-4 flex items-end gap-3">
              <div>
                <label
                  htmlFor="schedule-datetime"
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Date &amp; Time
                </label>
                <input
                  id="schedule-datetime"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <button
                type="button"
                disabled={isSubmitting || !scheduledAt}
                onClick={() => handleSubmit('schedule')}
                className="rounded-brand bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== RIGHT: Preview ==================== */}
      <div className="space-y-4">
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-gray-700">Preview</h2>

          {selectedAccountIds.size === 0 ? (
            <p className="mt-4 text-sm text-gray-400">
              Select an account to see a preview of your post.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {activeAccounts
                .filter((a) => selectedAccountIds.has(a.id))
                .map((account) => {
                  const colorDot =
                    PLATFORM_COLORS[account.platform.toLowerCase()] ?? 'bg-gray-500';
                  return (
                    <div key={account.id} className="space-y-2">
                      {/* Platform badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ${colorDot}`}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {account.platform}
                        </span>
                      </div>

                      {/* Mock post card */}
                      <div className="rounded-brand border p-4">
                        <div className="flex items-center gap-2">
                          {account.avatar_url ? (
                            <Image
                              src={account.avatar_url}
                              alt=""
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
                              {(account.display_name || account.platform_username)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold leading-tight">
                              {account.display_name || account.platform_username}
                            </p>
                            <p className="text-xs text-gray-400">
                              @{account.platform_username}
                            </p>
                          </div>
                        </div>

                        {/* Caption preview */}
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                          {caption || (
                            <span className="italic text-gray-300">Your content here...</span>
                          )}
                        </p>

                        {/* Media preview */}
                        {uploadedMedia.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-brand">
                            {uploadedMedia.slice(0, 4).map((m) =>
                              m.url ? (
                                <div key={m.id} className="relative h-24 w-full">
                                  <Image
                                    src={m.url}
                                    alt={m.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div
                                  key={m.id}
                                  className="flex h-24 items-center justify-center bg-gray-100 text-xs text-gray-400"
                                >
                                  {m.name}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
