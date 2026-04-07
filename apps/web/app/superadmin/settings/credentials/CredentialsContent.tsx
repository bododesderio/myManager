'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConfigEntry {
  key: string;
  value: string | null;
}

interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
}

interface CredentialSection {
  id: string;
  label: string;
  category: string;
  fields: CredentialField[];
}

/* ------------------------------------------------------------------ */
/*  Section definitions                                                */
/* ------------------------------------------------------------------ */

const sections: CredentialSection[] = [
  {
    id: 'oauth',
    label: 'OAuth',
    category: 'oauth',
    fields: [
      { key: 'FACEBOOK_APP_ID', label: 'Facebook APP_ID', secret: false },
      { key: 'FACEBOOK_APP_SECRET', label: 'Facebook APP_SECRET', secret: true },
      { key: 'TWITTER_CLIENT_ID', label: 'Twitter/X CLIENT_ID', secret: false },
      { key: 'TWITTER_CLIENT_SECRET', label: 'Twitter/X CLIENT_SECRET', secret: true },
      { key: 'LINKEDIN_CLIENT_ID', label: 'LinkedIn CLIENT_ID', secret: false },
      { key: 'LINKEDIN_CLIENT_SECRET', label: 'LinkedIn CLIENT_SECRET', secret: true },
      { key: 'TIKTOK_CLIENT_KEY', label: 'TikTok CLIENT_KEY', secret: false },
      { key: 'TIKTOK_CLIENT_SECRET', label: 'TikTok CLIENT_SECRET', secret: true },
      { key: 'GOOGLE_CLIENT_ID', label: 'Google CLIENT_ID', secret: false },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Google CLIENT_SECRET', secret: true },
      { key: 'PINTEREST_APP_ID', label: 'Pinterest APP_ID', secret: false },
      { key: 'PINTEREST_APP_SECRET', label: 'Pinterest APP_SECRET', secret: true },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    category: 'payments',
    fields: [
      { key: 'FLUTTERWAVE_PUBLIC_KEY', label: 'Flutterwave PUBLIC_KEY', secret: false },
      { key: 'FLUTTERWAVE_SECRET_KEY', label: 'Flutterwave SECRET_KEY', secret: true },
      { key: 'FLUTTERWAVE_WEBHOOK_SECRET', label: 'Flutterwave WEBHOOK_SECRET', secret: true },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    category: 'email',
    fields: [{ key: 'RESEND_API_KEY', label: 'Resend API_KEY', secret: true }],
  },
  {
    id: 'storage',
    label: 'Storage',
    category: 'storage',
    fields: [
      { key: 'R2_ACCOUNT_ID', label: 'Cloudflare R2 ACCOUNT_ID', secret: false },
      { key: 'R2_ACCESS_KEY', label: 'Cloudflare R2 ACCESS_KEY', secret: false },
      { key: 'R2_SECRET_KEY', label: 'Cloudflare R2 SECRET_KEY', secret: true },
      { key: 'R2_BUCKET', label: 'Cloudflare R2 BUCKET', secret: false },
      { key: 'R2_PUBLIC_URL', label: 'Cloudflare R2 PUBLIC_URL', secret: false },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    category: 'ai',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API_KEY', secret: true },
      { key: 'OPENAI_API_KEY', label: 'OpenAI API_KEY', secret: true },
      { key: 'REPLICATE_API_KEY', label: 'Replicate API_KEY', secret: true },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    category: 'analytics',
    fields: [
      { key: 'GA_PROPERTY_ID', label: 'Google Analytics PROPERTY_ID', secret: false },
      { key: 'POSTHOG_API_KEY', label: 'PostHog API_KEY', secret: true },
      { key: 'SENTRY_DSN', label: 'Sentry DSN', secret: false },
      { key: 'SENTRY_AUTH_TOKEN', label: 'Sentry AUTH_TOKEN', secret: true },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    category: 'whatsapp',
    fields: [
      { key: 'WHATSAPP_SYSTEM_USER_TOKEN', label: 'System User Token', secret: true },
      { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID', secret: false },
      { key: 'WHATSAPP_WABA_ID', label: 'Business Account ID', secret: false },
    ],
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    category: 'webhooks',
    fields: [
      { key: 'WEBHOOK_VERIFY_TOKEN', label: 'Webhook Verify Token', secret: true },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    category: 'services',
    fields: [
      { key: 'LANGUAGETOOL_URL', label: 'LanguageTool URL', secret: false },
      { key: 'OPEN_EXCHANGE_RATES_API_KEY', label: 'Exchange Rates API Key', secret: true },
    ],
  },
  {
    id: 'branding',
    label: 'Branding & Email',
    category: 'branding',
    fields: [
      { key: 'BRAND_NAME', label: 'Brand Name', secret: false },
      { key: 'EMAIL_DOMAIN', label: 'Email Domain', secret: false },
      { key: 'WEB_URL', label: 'Web App URL', secret: false },
      { key: 'CORS_ORIGINS', label: 'CORS Origins', secret: false },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskValue(value: string | null, isSecret: boolean): string {
  if (!value) return 'Not set';
  if (!isSecret) return value;
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

/* ------------------------------------------------------------------ */
/*  Single credential row                                              */
/* ------------------------------------------------------------------ */

function CredentialRow({
  field,
  value,
  onSave,
}: {
  field: CredentialField;
  value: string | null;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  function handleEdit() {
    setInput(value ?? '');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(field.key, input);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{field.label}</p>
        {editing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              type={field.secret ? 'password' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full max-w-md rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-brand bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-brand border px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className={`mt-0.5 font-mono text-xs ${value ? 'text-gray-500' : 'text-orange-500'}`}>
            {maskValue(value, field.secret)}
          </p>
        )}
      </div>
      {!editing && (
        <button
          onClick={handleEdit}
          className="shrink-0 rounded-brand border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Edit
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CredentialsContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(sections[0].id);
  const [configs, setConfigs] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    try {
      const results = await Promise.all(
        sections.map(async (section) => {
          try {
            const res = await fetch(`/api/v1/admin/system-config?category=${section.category}`);
            if (!res.ok) return [];
            const json = (await res.json()) as { configs: ConfigEntry[] };
            return json.configs ?? [];
          } catch {
            return [];
          }
        }),
      );

      const map: Record<string, string | null> = {};
      for (const entries of results) {
        for (const entry of entries) {
          map[entry.key] = entry.value;
        }
      }
      setConfigs(map);
    } catch {
      toast({ title: 'Could not load credentials', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  async function handleSave(key: string, value: string) {
    try {
      const res = await fetch(`/api/v1/admin/system-config/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setConfigs((prev) => ({ ...prev, [key]: value }));
      toast({ title: `${key} saved`, variant: 'success' });
    } catch {
      toast({ title: `Failed to save ${key}`, variant: 'error' });
      throw new Error('save failed');
    }
  }

  const activeSection = sections.find((s) => s.id === activeTab) ?? sections[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Credentials</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-brand bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Credentials</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-brand border bg-gray-50 p-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`whitespace-nowrap rounded-brand px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === section.id
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="rounded-brand border bg-white shadow-sm">
        <h2 className="border-b px-6 py-4 font-heading text-lg font-semibold">
          {activeSection.label}
        </h2>
        <div className="divide-y">
          {activeSection.fields.map((field) => (
            <CredentialRow
              key={field.key}
              field={field}
              value={configs[field.key] ?? null}
              onSave={handleSave}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
