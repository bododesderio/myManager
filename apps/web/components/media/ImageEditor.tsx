'use client';

import { useState } from 'react';

interface ImageEditorProps {
  imageUrl: string;
  onSave?: (editedImageUrl: string) => void;
  onCancel?: () => void;
}

type CropRatio = '1:1' | '4:5' | '16:9' | '9:16' | 'free';

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [cropRatio, setCropRatio] = useState<CropRatio>('free');

  const ratios: CropRatio[] = ['1:1', '4:5', '16:9', '9:16', 'free'];

  const handleSave = () => {
    onSave?.(imageUrl);
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div
          className="aspect-video rounded-brand border bg-gray-100"
          style={{
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
          }}
        >
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Image Preview: {imageUrl}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {ratios.map((ratio) => (
            <button
              key={ratio}
              onClick={() => setCropRatio(ratio)}
              className={`rounded-brand px-3 py-1 text-xs font-medium ${
                cropRatio === ratio ? 'bg-brand-primary text-white' : 'border hover:border-brand-primary'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      <div className="w-64 space-y-4">
        <h3 className="font-heading font-semibold">Adjustments</h3>
        <div>
          <label className="flex justify-between text-sm text-gray-700">
            Brightness <span className="text-gray-400">{brightness}%</span>
          </label>
          <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="mt-1 w-full" />
        </div>
        <div>
          <label className="flex justify-between text-sm text-gray-700">
            Contrast <span className="text-gray-400">{contrast}%</span>
          </label>
          <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="mt-1 w-full" />
        </div>
        <div>
          <label className="flex justify-between text-sm text-gray-700">
            Saturation <span className="text-gray-400">{saturation}%</span>
          </label>
          <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="mt-1 w-full" />
        </div>

        <div className="flex gap-2 pt-4">
          <button onClick={handleSave} className="flex-1 rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
            Save
          </button>
          <button onClick={onCancel} className="flex-1 rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-gray-400">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
