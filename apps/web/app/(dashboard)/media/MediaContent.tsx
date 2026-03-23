'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMedia, useUploadMedia, useDeleteMedia } from '@/lib/hooks/useMedia';
import { useToast } from '@/providers/ToastProvider';

const TYPE_FILTERS = [
  { label: 'All Types', value: '' },
  { label: 'Images', value: 'image' },
  { label: 'Videos', value: 'video' },
  { label: 'GIFs', value: 'gif' },
];

function getMediaIcon(mimeType: string) {
  if (mimeType?.startsWith('video/')) {
    return (
      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  if (mimeType?.includes('gif')) {
    return <span className="text-sm font-bold text-gray-400">GIF</span>;
  }
  return (
    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function MediaContent() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const perPage = 24;
  const { data, isLoading } = useMedia({
    type: typeFilter || undefined,
    page,
    per_page: perPage,
    search: search || undefined,
  });
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const { addToast } = useToast();

  const mediaItems = (data as any)?.media || (data as any)?.items || (data as any) || [];
  const total = (data as any)?.total || (data as any)?.pagination?.total || 0;
  const storageUsed = (data as any)?.storageUsed || (data as any)?.storage_used || 0;
  const storageLimit = (data as any)?.storageLimit || (data as any)?.storage_limit || 0;
  const hasMore = Array.isArray(mediaItems) && mediaItems.length >= perPage;

  function handleUpload() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      uploadMedia.mutate(file, {
        onSuccess: () => {
          addToast({ type: 'success', message: `Uploaded ${file.name}` });
        },
        onError: () => {
          addToast({ type: 'error', message: `Failed to upload ${file.name}` });
        },
      });
    });
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  }

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteMedia.mutate(deletingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Media deleted.' });
        setDeletingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete media.' });
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-gray-500">Upload and manage your images, videos, and files.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploadMedia.isPending}
            className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {uploadMedia.isPending ? 'Uploading...' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,.gif"
            multiple
            onChange={onFileChange}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search media..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-brand border border-gray-300 px-4 py-2 text-sm"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-brand border bg-gray-100"
            />
          ))}
        </div>
      ) : !Array.isArray(mediaItems) || mediaItems.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">No media found</h3>
          <p className="mt-1 text-sm text-gray-500">Upload your first file to get started.</p>
          <button
            onClick={handleUpload}
            className="mt-4 inline-block rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Upload Media
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {mediaItems.map((item: any) => {
              const url = item.url || item.thumbnailUrl || item.thumbnail_url;
              const mimeType = item.mimeType || item.mime_type || '';
              const isImage = mimeType.startsWith('image/') && !mimeType.includes('gif');
              const name = item.name || item.fileName || item.file_name || 'Untitled';

              return (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-brand border bg-gray-100 transition hover:border-brand-primary"
                >
                  {url && isImage ? (
                    <Image
                      src={url}
                      alt={name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {getMediaIcon(mimeType)}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                    <div className="flex justify-end p-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-full bg-black/40 p-1.5 text-white transition hover:bg-red-600"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs text-white">{name}</p>
                      {item.size && (
                        <p className="text-[10px] text-white/70">{formatBytes(item.size)}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {total > 0 && (
                <span>
                  Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total} items
                </span>
              )}
              {storageUsed > 0 && storageLimit > 0 && (
                <span className="ml-2">
                  &middot; {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="rounded-brand border px-3 py-1.5 text-sm transition hover:border-brand-primary"
                >
                  Previous
                </button>
              )}
              {hasMore && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="rounded-brand border px-3 py-1.5 text-sm transition hover:border-brand-primary"
                >
                  Load More
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Delete Media</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMedia.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMedia.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
