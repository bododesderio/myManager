'use client';

import { useState, type ChangeEvent } from 'react';

interface PostComposerProps {
  initialContent?: string;
  onSubmit?: (content: string, platforms: string[]) => void;
}

const PLATFORMS = ['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok', 'Pinterest', 'YouTube', 'WhatsApp', 'Threads', 'GBP'] as const;
type Platform = (typeof PLATFORMS)[number];

export function PostComposer({ initialContent = '', onSubmit }: PostComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSubmit = () => {
    if (content.trim() && selectedPlatforms.size > 0) {
      onSubmit?.(content, Array.from(selectedPlatforms));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700">Platforms</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedPlatforms.has(platform)
                  ? 'bg-brand-primary text-white'
                  : 'border border-gray-300 hover:border-brand-primary'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="composer-content" className="block text-sm font-semibold text-gray-700">
          Content
        </label>
        <textarea
          id="composer-content"
          value={content}
          onChange={handleContentChange}
          rows={6}
          placeholder="What would you like to share?"
          className="mt-2 block w-full resize-none rounded-brand border border-gray-300 px-4 py-3 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
        <p className="mt-1 text-right text-xs text-gray-500">{content.length} / 2,200</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || selectedPlatforms.size === 0}
          className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          Publish Now
        </button>
        <button className="rounded-brand border border-brand-primary px-6 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">
          Schedule
        </button>
        <button className="rounded-brand border px-6 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-400">
          Save Draft
        </button>
      </div>
    </div>
  );
}
