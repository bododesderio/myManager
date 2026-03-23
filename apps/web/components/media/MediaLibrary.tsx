'use client';

import { useState } from 'react';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  size: number;
  createdAt: string;
}

interface MediaLibraryProps {
  items?: MediaItem[];
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
}

export function MediaLibrary({ items = [], onSelect, selectable = false }: MediaLibraryProps) {
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'gif'>('all');
  const [search, setSearch] = useState('');

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search media..."
          className="flex-1 rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-brand border border-gray-300 px-4 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="gif">GIFs</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => selectable && onSelect?.(item)}
            className={`group relative aspect-square overflow-hidden rounded-brand border bg-gray-100 transition ${
              selectable ? 'cursor-pointer hover:border-brand-primary' : ''
            }`}
          >
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              {item.type.toUpperCase()}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
              <p className="truncate text-xs text-white">{item.name}</p>
              <p className="text-[10px] text-white/70">{(item.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-center text-sm text-gray-500">No media files found.</p>
      )}
    </div>
  );
}
