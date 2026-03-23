'use client';

import { useCallback, useRef, useState } from 'react';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 50 * 1024 * 1024,
  label,
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSize) {
        setError(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }
      setError('');
      setUploading(true);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append('file', file);

        setProgress(30);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        setProgress(80);

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(data.error || 'Upload failed');
        }

        const data = await res.json();
        setProgress(100);
        onChange(data.url);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [maxSize, onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const isImage = value && (value.startsWith('/uploads/') || value.startsWith('http')) && accept.includes('image');

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative rounded-brand border-2 border-dashed border-gray-300 p-4 transition hover:border-brand-primary"
      >
        {value && isImage && (
          <div className="mb-3 flex items-center gap-3">
            <img src={value} alt="Preview" className="h-16 w-16 rounded border object-cover" />
            <span className="truncate text-xs text-gray-500">{value}</span>
          </div>
        )}

        {value && !isImage && (
          <div className="mb-3">
            <span className="truncate text-xs text-gray-500">{value}</span>
          </div>
        )}

        {uploading && (
          <div className="mb-3">
            <div className="h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full bg-brand-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Uploading...</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-brand bg-brand-primary px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {value ? 'Replace' : 'Upload'}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Remove
            </button>
          )}

          <span className="text-xs text-gray-400">or drag and drop</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
