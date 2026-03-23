'use client';

import { useState } from 'react';

interface PlanLimits {
  maxAccounts: number;
  maxMembers: number;
  maxStorageGB: number;
  maxPostsPerMonth: number;
  features: string[];
}

interface PlanBuilderProps {
  initialName?: string;
  initialPrice?: number;
  initialLimits?: Partial<PlanLimits>;
  onSave?: (plan: { name: string; price: number; limits: PlanLimits }) => void;
}

const DEFAULT_LIMITS: PlanLimits = {
  maxAccounts: 5,
  maxMembers: 1,
  maxStorageGB: 1,
  maxPostsPerMonth: 30,
  features: [],
};

const AVAILABLE_FEATURES = [
  'Advanced Analytics',
  'Custom Reports',
  'Team Collaboration',
  'Approval Workflows',
  'API Access',
  'White Label',
  'Priority Support',
  'Custom Integrations',
];

export function PlanBuilder({ initialName = '', initialPrice = 0, initialLimits, onSave }: PlanBuilderProps) {
  const [name, setName] = useState(initialName);
  const [price, setPrice] = useState(initialPrice);
  const [limits, setLimits] = useState<PlanLimits>({ ...DEFAULT_LIMITS, ...initialLimits });

  const toggleFeature = (feature: string) => {
    setLimits((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSave = () => {
    onSave?.({ name, price, limits });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Plan Name</label>
          <input id="planName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
        <div>
          <label htmlFor="planPrice" className="block text-sm font-medium text-gray-700">Monthly Price (USD)</label>
          <input id="planPrice" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Accounts</label>
          <input type="number" min="1" value={limits.maxAccounts} onChange={(e) => setLimits((p) => ({ ...p, maxAccounts: Number(e.target.value) }))} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Members</label>
          <input type="number" min="1" value={limits.maxMembers} onChange={(e) => setLimits((p) => ({ ...p, maxMembers: Number(e.target.value) }))} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Storage (GB)</label>
          <input type="number" min="1" value={limits.maxStorageGB} onChange={(e) => setLimits((p) => ({ ...p, maxStorageGB: Number(e.target.value) }))} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Posts/Month</label>
          <input type="number" min="0" value={limits.maxPostsPerMonth} onChange={(e) => setLimits((p) => ({ ...p, maxPostsPerMonth: Number(e.target.value) }))} className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Features</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVAILABLE_FEATURES.map((feature) => (
            <button
              key={feature}
              onClick={() => toggleFeature(feature)}
              className={`rounded-full px-3 py-1 text-sm ${
                limits.features.includes(feature) ? 'bg-brand-primary text-white' : 'border hover:border-brand-primary'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
        Save Plan
      </button>
    </div>
  );
}
