'use client';

import { useState } from 'react';

interface BrandConfig {
  appName: string;
  tagline: string;
  primaryColor: string;
  primaryDarkColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
}

interface BrandEditorProps {
  initialConfig?: Partial<BrandConfig>;
  onSave?: (config: BrandConfig) => void;
}

const DEFAULT_CONFIG: BrandConfig = {
  appName: 'myManager',
  tagline: 'Social Media Management Platform',
  primaryColor: '#6366f1',
  primaryDarkColor: '#4f46e5',
  accentColor: '#f59e0b',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  borderRadius: '0.5rem',
};

export function BrandEditor({ initialConfig, onSave }: BrandEditorProps) {
  const [config, setConfig] = useState<BrandConfig>({ ...DEFAULT_CONFIG, ...initialConfig });

  const update = <K extends keyof BrandConfig>(key: K, value: BrandConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">App Name</label>
          <input type="text" value={config.appName} onChange={(e) => update('appName', e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tagline</label>
          <input type="text" value={config.tagline} onChange={(e) => update('tagline', e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          <input type="color" value={config.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="mt-1 h-10 w-full rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Dark</label>
          <input type="color" value={config.primaryDarkColor} onChange={(e) => update('primaryDarkColor', e.target.value)} className="mt-1 h-10 w-full rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Accent</label>
          <input type="color" value={config.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="mt-1 h-10 w-full rounded border" />
        </div>
      </div>

      <div className="rounded-brand border bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-700">Preview</h4>
        <div className="mt-3 flex items-center gap-4">
          <div className="rounded-brand px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: config.primaryColor }}>
            Primary Button
          </div>
          <div className="rounded-brand px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: config.accentColor }}>
            Accent Button
          </div>
          <span style={{ fontFamily: config.headingFont, fontWeight: 700 }}>{config.appName}</span>
        </div>
      </div>

      <button onClick={() => onSave?.(config)} className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
        Save Brand Configuration
      </button>
    </div>
  );
}
