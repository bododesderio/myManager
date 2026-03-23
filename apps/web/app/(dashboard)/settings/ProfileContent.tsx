'use client';

import type { Route } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useUser';
import { useToast } from '@/providers/ToastProvider';
import { FileUpload } from '@/components/FileUpload';

const settingsLinks = [
  { href: '/settings/accounts', label: 'Connected Accounts', description: 'Manage your social media connections.' },
  { href: '/settings/billing', label: 'Billing', description: 'Manage subscription and payment methods.' },
  { href: '/settings/workspace', label: 'Workspace', description: 'Configure workspace settings and preferences.' },
  { href: '/settings/notifications', label: 'Notifications', description: 'Control email and push notification settings.' },
  { href: '/settings/security', label: 'Security', description: 'Password, two-factor authentication, and sessions.' },
  { href: '/settings/privacy', label: 'Privacy', description: 'Data handling and privacy preferences.' },
  { href: '/settings/integrations', label: 'Integrations', description: 'Connect third-party tools and services.' },
  { href: '/settings/brand', label: 'Brand', description: 'Customize your workspace branding.' },
  { href: '/settings/language', label: 'Language & Region', description: 'Set language, currency, and timezone.' },
];

export default function ProfileContent() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    if (profile) {
      setName((profile as any).name ?? '');
      setAvatarUrl((profile as any).avatar_url ?? '');
      setTimezone((profile as any).timezone ?? 'UTC');
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { name, avatar_url: avatarUrl, timezone },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Profile updated successfully.' }),
        onError: () => addToast({ type: 'error', message: 'Failed to update profile.' }),
      },
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account and workspace settings.</p>
      </div>

      {/* Profile form */}
      <div className="max-w-2xl rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="profileName" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="profileEmail"
              type="email"
              value={(profile as any)?.email ?? ''}
              readOnly
              className="mt-1 block w-full rounded-brand border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
          </div>
          <FileUpload
            label="Avatar"
            value={avatarUrl}
            onChange={setAvatarUrl}
            accept="image/*"
          />
          <div>
            <label htmlFor="profileTimezone" className="block text-sm font-medium text-gray-700">Timezone</label>
            <select
              id="profileTimezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="Africa/Lagos">Africa/Lagos</option>
              <option value="Africa/Nairobi">Africa/Nairobi</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="mt-6 rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Settings navigation grid */}
      <div>
        <h2 className="font-heading text-lg font-semibold">Other Settings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className="rounded-brand border bg-white p-5 shadow-sm transition hover:border-brand-primary"
            >
              <h3 className="font-heading font-semibold">{link.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
