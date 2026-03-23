'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreatePlan } from '@/lib/hooks/useAdmin';
import { useToast } from '@/providers/ToastProvider';

export function PlanCreateContent() {
  const router = useRouter();
  const createPlan = useCreatePlan();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    monthlyPrice: '',
    yearlyPrice: '',
    maxAccounts: '',
    maxMembers: '',
    maxStorage: '',
    maxPosts: '',
    features: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createPlan.mutate(
      {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        monthlyPrice: parseFloat(form.monthlyPrice) || 0,
        yearlyPrice: parseFloat(form.yearlyPrice) || 0,
        limits: {
          socialAccounts: parseInt(form.maxAccounts) || null,
          teamMembers: parseInt(form.maxMembers) || null,
          storageGb: parseInt(form.maxStorage) || null,
          postsPerMonth: parseInt(form.maxPosts) || null,
        },
        features: form.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          toast({ title: 'Plan created', variant: 'success' });
          router.push('/admin/plans' as Route);
        },
        onError: () => toast({ title: 'Failed to create plan', variant: 'error' }),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/plans" className="text-sm text-brand-primary hover:underline">
          &larr; Plans
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Create New Plan</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-brand border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-gray-700">
              Plan Name
            </label>
            <input
              id="planName"
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="planSlug" className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              id="planSlug"
              type="text"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder={form.name.toLowerCase().replace(/\s+/g, '-') || 'auto-generated'}
              className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="monthlyPrice" className="block text-sm font-medium text-gray-700">
                Monthly Price (USD)
              </label>
              <input
                id="monthlyPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.monthlyPrice}
                onChange={(e) => update('monthlyPrice', e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="yearlyPrice" className="block text-sm font-medium text-gray-700">
                Yearly Price (USD)
              </label>
              <input
                id="yearlyPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.yearlyPrice}
                onChange={(e) => update('yearlyPrice', e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-brand border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-lg font-semibold">Limits</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxAccounts" className="block text-sm font-medium text-gray-700">
                Max Social Accounts
              </label>
              <input
                id="maxAccounts"
                type="number"
                min="1"
                value={form.maxAccounts}
                onChange={(e) => update('maxAccounts', e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700">
                Max Team Members
              </label>
              <input
                id="maxMembers"
                type="number"
                min="1"
                value={form.maxMembers}
                onChange={(e) => update('maxMembers', e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="maxStorage" className="block text-sm font-medium text-gray-700">
                Storage (GB)
              </label>
              <input
                id="maxStorage"
                type="number"
                min="1"
                value={form.maxStorage}
                onChange={(e) => update('maxStorage', e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="maxPosts" className="block text-sm font-medium text-gray-700">
                Posts per Month
              </label>
              <input
                id="maxPosts"
                type="number"
                min="0"
                value={form.maxPosts}
                onChange={(e) => update('maxPosts', e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-brand border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-lg font-semibold">Features</h2>
          <div>
            <label htmlFor="features" className="block text-sm font-medium text-gray-700">
              Features (one per line)
            </label>
            <textarea
              id="features"
              rows={5}
              value={form.features}
              onChange={(e) => update('features', e.target.value)}
              placeholder="Analytics dashboard&#10;AI caption writer&#10;Team collaboration"
              className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createPlan.isPending}
          className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {createPlan.isPending ? 'Creating...' : 'Create Plan'}
        </button>
      </form>
    </div>
  );
}
