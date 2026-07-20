'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const CKEditorWrapper = dynamic(
  () => import('./CKEditorWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center rounded-brand border border-border bg-bg-2">
        <span className="text-sm text-text-muted">Loading editor...</span>
      </div>
    ),
  },
);

export function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'source'>('visual');

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('visual')}
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === 'visual' ? 'bg-primary text-white' : 'bg-bg-2 text-text-2'
          }`}
        >
          Visual
        </button>
        <button
          type="button"
          onClick={() => setMode('source')}
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === 'source' ? 'bg-primary text-white' : 'bg-bg-2 text-text-2'
          }`}
        >
          Source
        </button>
      </div>

      {mode === 'visual' ? (
        <CKEditorWrapper
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="block w-full rounded-brand border border-border border-border px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
