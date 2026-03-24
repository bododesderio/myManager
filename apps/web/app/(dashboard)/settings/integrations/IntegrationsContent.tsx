'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/providers/ToastProvider';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  created_at: string;
}

export default function IntegrationsContent() {
  const { addToast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  // API key creation
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // Webhook creation
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

  const AVAILABLE_EVENTS = [
    'post.published',
    'post.failed',
    'post.created',
    'comment.received',
    'account.connected',
    'account.disconnected',
  ];

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      addToast({ type: 'error', message: 'Please enter a name for the API key.' });
      return;
    }
    const key: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      key: `mm_${crypto.randomUUID().replace(/-/g, '')}`,
      created_at: new Date().toISOString(),
    };
    setApiKeys((prev) => [...prev, key]);
    setNewKeyName('');
    setShowNewKey(false);
    addToast({ type: 'success', message: 'API key created. Copy it now -- it will not be shown again.' });
  };

  const handleRevokeKey = (id: string) => {
    if (!confirm('Revoke this API key? Any integrations using it will stop working.')) return;
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    addToast({ type: 'success', message: 'API key revoked.' });
  };

  const handleCreateWebhook = () => {
    if (!newWebhookUrl.trim()) {
      addToast({ type: 'error', message: 'Please enter a webhook URL.' });
      return;
    }
    if (newWebhookEvents.length === 0) {
      addToast({ type: 'error', message: 'Please select at least one event.' });
      return;
    }
    const webhook: Webhook = {
      id: crypto.randomUUID(),
      url: newWebhookUrl,
      events: newWebhookEvents,
      created_at: new Date().toISOString(),
    };
    setWebhooks((prev) => [...prev, webhook]);
    setNewWebhookUrl('');
    setNewWebhookEvents([]);
    setShowNewWebhook(false);
    addToast({ type: 'success', message: 'Webhook endpoint created.' });
  };

  const handleDeleteWebhook = (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    addToast({ type: 'success', message: 'Webhook endpoint deleted.' });
  };

  const toggleWebhookEvent = (event: string) => {
    setNewWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Integrations</h1>

      <div className="max-w-2xl space-y-6">
        {/* API Keys */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">API Keys</h2>
            <button
              onClick={() => setShowNewKey(true)}
              className="rounded-brand bg-brand-primary px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
            >
              Create Key
            </button>
          </div>

          {showNewKey && (
            <div className="mt-4 rounded-brand border border-brand-primary/30 bg-brand-primary/5 p-4">
              <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">Key Name</label>
              <input
                id="keyName"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production API"
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCreateKey}
                  className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewKey(false); setNewKeyName(''); }}
                  className="rounded-brand border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {apiKeys.length === 0 && !showNewKey ? (
            <p className="mt-4 text-sm text-gray-500">No API keys created yet.</p>
          ) : (
            <div className="mt-4 divide-y">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{key.name}</p>
                    <p className="font-mono text-xs text-gray-500">{key.key.slice(0, 12)}...{key.key.slice(-4)}</p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="rounded-brand border border-red-300 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook Endpoints */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Webhook Endpoints</h2>
            <button
              onClick={() => setShowNewWebhook(true)}
              className="rounded-brand bg-brand-primary px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
            >
              Add Endpoint
            </button>
          </div>

          {showNewWebhook && (
            <div className="mt-4 rounded-brand border border-brand-primary/30 bg-brand-primary/5 p-4">
              <div>
                <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Endpoint URL</label>
                <input
                  id="webhookUrl"
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
                />
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700">Events</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleWebhookEvent(event)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        newWebhookEvents.includes(event)
                          ? 'bg-brand-primary text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-brand-primary'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCreateWebhook}
                  className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  Create Endpoint
                </button>
                <button
                  onClick={() => { setShowNewWebhook(false); setNewWebhookUrl(''); setNewWebhookEvents([]); }}
                  className="rounded-brand border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {webhooks.length === 0 && !showNewWebhook ? (
            <p className="mt-4 text-sm text-gray-500">No webhook endpoints configured yet.</p>
          ) : (
            <div className="mt-4 divide-y">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium font-mono">{webhook.url}</p>
                    <p className="text-xs text-gray-500">
                      Events: {webhook.events.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(webhook.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="rounded-brand border border-red-300 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
