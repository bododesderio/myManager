'use client';

import { useState } from 'react';

interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  photographer: string;
}

interface StockPhotoPickerProps {
  onSelect?: (photo: StockPhoto) => void;
  onClose?: () => void;
}

export function StockPhotoPicker({ onSelect, onClose }: StockPhotoPickerProps) {
  const [query, setQuery] = useState('');
  const [results] = useState<StockPhoto[]>([]);

  return (
    <div className="rounded-brand border bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Stock Photos</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          &#10005;
        </button>
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for photos..."
          className="block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {results.length > 0 ? (
          results.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onSelect?.(photo)}
              className="group relative aspect-square overflow-hidden rounded-brand bg-gray-100"
            >
              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                Photo
              </div>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100">
                <p className="p-2 text-xs text-white">{photo.photographer}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center text-sm text-gray-500">
            {query ? 'No photos found. Try a different search.' : 'Search for stock photos to get started.'}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Photos provided by Unsplash and Pexels.
      </p>
    </div>
  );
}
