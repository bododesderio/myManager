'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useToast } from '@/providers/ToastProvider';

interface BrandFeatures {
  maintenance_mode: boolean;
  registration_open: boolean;
  show_blog: boolean;
  show_affiliate: boolean;
}

interface BrandData {
  features: BrandFeatures;
  [key: string]: unknown;
}

export function SystemSettingsContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState<BrandData | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/cms/brand');
      if (!res.ok) throw new Error('Failed to load settings');
      const json = (await res.json()) as BrandData;
      setBrand(json);
    } catch {
      toast({ title: 'Could not load system settings', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleFeature(key: keyof BrandFeatures) {
    if (!brand) return;
    setBrand({
      ...brand,
      features: {
        ...brand.features,
        [key]: !brand.features[key],
      },
    });
  }

  async function handleSave() {
    if (!brand) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/cms/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', variant: 'success' });
    } catch {
      toast({ title: 'Could not save settings', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const toggles: { key: keyof BrandFeatures; label: string; description: string }[] = [
    {
      key: 'maintenance_mode',
      label: 'Maintenance Mode',
      description: 'When enabled, the site shows a maintenance page to non-admin visitors.',
    },
    {
      key: 'registration_open',
      label: 'Registration Open',
      description: 'Allow new users to create accounts.',
    },
    {
      key: 'show_blog',
      label: 'Show Blog',
      description: 'Display the blog section on the public site.',
    },
    {
      key: 'show_affiliate',
      label: 'Show Affiliate Program',
      description: 'Display the affiliate program section.',
    },
  ];

  const subPages: { href: Route; label: string; description: string }[] = [
    { href: '/admin/settings/theme' as Route, label: 'Theme', description: 'Colors, fonts, and visual appearance' },
    { href: '/admin/brand' as Route, label: 'Brand', description: 'App name, logo, emails, and metadata' },
    {
      href: '/admin/settings/credentials' as Route,
      label: 'Credentials',
      description: 'OAuth, payment, and third-party API keys',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">System Settings</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-brand bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">System Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-brand bg-brand-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Feature toggles */}
      <div className="rounded-brand border bg-white shadow-sm">
        <h2 className="border-b px-6 py-4 font-heading text-lg font-semibold">Feature Flags</h2>
        <div className="divide-y">
          {toggles.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <button
                onClick={() => toggleFeature(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  brand?.features[key] ? 'bg-brand-primary' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={brand?.features[key] ?? false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                    brand?.features[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-page links */}
      <div className="rounded-brand border bg-white shadow-sm">
        <h2 className="border-b px-6 py-4 font-heading text-lg font-semibold">Configuration</h2>
        <div className="divide-y">
          {subPages.map(({ href, label, description }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-brand-primary">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
