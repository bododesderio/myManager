'use client';

import { useState } from 'react';

interface VideoTrimmerProps {
  videoUrl: string;
  duration: number;
  onTrim?: (startTime: number, endTime: number) => void;
  onCancel?: () => void;
}

export function VideoTrimmer({ videoUrl, duration, onTrim, onCancel }: VideoTrimmerProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(duration);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrim = () => {
    onTrim?.(startTime, endTime);
  };

  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-brand border bg-gray-900">
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          Video Preview: {videoUrl}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading font-semibold">Trim Video</h3>

        <div className="rounded-brand border bg-gray-50 p-4">
          <div className="relative h-12 rounded bg-gray-200">
            <div
              className="absolute h-full rounded bg-brand-primary/30"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`,
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Start Time</label>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={startTime}
                onChange={(e) => setStartTime(Math.min(Number(e.target.value), endTime - 1))}
                className="w-full"
              />
              <span className="text-sm font-mono">{formatTime(startTime)}</span>
            </div>
            <div>
              <label className="text-xs text-gray-500">End Time</label>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={endTime}
                onChange={(e) => setEndTime(Math.max(Number(e.target.value), startTime + 1))}
                className="w-full"
              />
              <span className="text-sm font-mono">{formatTime(endTime)}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Duration: {formatTime(endTime - startTime)} / {formatTime(duration)}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleTrim} className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
            Trim Video
          </button>
          <button onClick={onCancel} className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-gray-400">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
