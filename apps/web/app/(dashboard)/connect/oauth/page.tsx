'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/providers/ToastProvider';
import { Card } from '@mymanager/ui';
import { apiClient } from '@/lib/api/client';
import { usePlatforms, useConfiguredPlatforms, normalizePlatformSlug } from '@/lib/hooks/usePlatforms';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { PlatformIcon } from '@/components/icons/PlatformIcon';

// A single, STATIC redirect URI (no per-request query params) so it can be
// registered verbatim in each provider's developer console. The platform and
// workspace are recovered from the server-stored OAuth `state`.
function redirectUri() {
  return `${window.location.origin}/connect/oauth`;
}

export default function OAuthConnectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const platformParam = searchParams.get('platform');

  // `code` + `state` present ⇒ the provider redirected back to us; run the
  // callback. Otherwise this is the entry point ⇒ show the platform picker.
  const isCallback = Boolean(code && state) || Boolean(oauthError);

  return isCallback ? (
    <CallbackView
      code={code}
      state={state}
      oauthError={oauthError}
      oauthErrorDescription={searchParams.get('error_description')}
      router={router}
      addToast={addToast}
    />
  ) : (
    <PickerView initialPlatform={platformParam} addToast={addToast} />
  );
}

/* ================================================================== */
/*  Callback — exchange the code for tokens via the API.               */
/* ================================================================== */
function CallbackView({
  code,
  state,
  oauthError,
  oauthErrorDescription,
  router,
  addToast,
}: {
  code: string | null;
  state: string | null;
  oauthError: string | null;
  oauthErrorDescription: string | null;
  router: ReturnType<typeof useRouter>;
  addToast: ReturnType<typeof useToast>['addToast'];
}) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing...');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React double-invoke
    ran.current = true;

    // The provider denied consent or errored before issuing a code.
    if (oauthError) {
      setStatus('error');
      setMessage(oauthErrorDescription || `Authorisation failed: ${oauthError}`);
      return;
    }
    if (!code || !state) {
      setStatus('error');
      setMessage('Missing OAuth parameters.');
      return;
    }

    (async () => {
      try {
        await apiClient.post('/social-accounts/callback', {
          code,
          state,
          workspaceId: activeWorkspaceId || '',
        });
        setStatus('success');
        setMessage('Account connected successfully!');
        addToast({ type: 'success', message: 'Social account connected!' });
        setTimeout(() => router.push('/settings/accounts'), 1500);
      } catch (err: any) {
        setStatus('error');
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to connect account.';
        setMessage(msg);
        addToast({ type: 'error', message: msg });
      }
    })();
  }, [code, state, oauthError, oauthErrorDescription, activeWorkspaceId, router, addToast]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card padding="none" className="max-w-sm p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-text-2">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-text">{message}</p>
            <p className="mt-2 text-xs text-text-2">Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-text">{message}</p>
            <button
              onClick={() => router.push('/settings/accounts')}
              className="mt-4 rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Back to Accounts
            </button>
          </>
        )}
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Picker — start an OAuth flow for a chosen platform.                */
/* ================================================================== */
function PickerView({
  initialPlatform,
  addToast,
}: {
  initialPlatform: string | null;
  addToast: ReturnType<typeof useToast>['addToast'];
}) {
  const { data: platforms, isLoading } = usePlatforms();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: configured } = useConfiguredPlatforms(activeWorkspaceId);
  const [connecting, setConnecting] = useState<string | null>(null);

  const configuredSet = new Set(configured ?? []);
  const isConfigured = (slug: string) => configuredSet.has(normalizePlatformSlug(slug));

  async function startConnect(slug: string) {
    if (!activeWorkspaceId) {
      addToast({ type: 'error', message: 'No workspace selected.' });
      return;
    }
    setConnecting(slug);
    try {
      const res = await apiClient.post<{ authorizationUrl: string }>(
        `/social-accounts/connect/${slug}`,
        { workspaceId: activeWorkspaceId, redirectUri: redirectUri() },
      );

      const url = (res as any)?.authorizationUrl ?? (res as any)?.data?.authorizationUrl;
      if (!url) throw new Error('No authorization URL returned.');
      window.location.href = url;
    } catch (err: any) {
      setConnecting(null);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not start the connection. This platform may not be configured yet.';
      addToast({ type: 'error', message: msg });
    }
  }

  // Auto-start when arriving via a "Reconnect" link (?platform=x, no code).
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current) return;
    if (!initialPlatform || isLoading || !activeWorkspaceId) return;
    autoStarted.current = true;
    startConnect(initialPlatform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlatform, isLoading, activeWorkspaceId]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Connect an account</h1>
        <p className="mt-1 text-sm text-text-2">
          Choose a platform to authorise. You&apos;ll be redirected to sign in and grant access,
          then brought back here.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-text-2">Loading platforms...</div>
      ) : !platforms || platforms.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-2">
          No platforms are available to connect right now.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...platforms]
            // Connectable platforms first, "coming soon" after; stable by name.
            .sort((a, b) => {
              const d = Number(isConfigured(b.slug)) - Number(isConfigured(a.slug));
              return d !== 0 ? d : a.name.localeCompare(b.name);
            })
            .map((p) => {
              const ready = isConfigured(p.slug);
              const busy = connecting === p.slug;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!ready || Boolean(connecting)}
                  aria-disabled={!ready}
                  onClick={() => ready && startConnect(p.slug)}
                  className={`flex items-center justify-between rounded-brand border px-5 py-4 text-left shadow-sm transition ${
                    ready
                      ? 'border-border bg-bg hover:border-primary disabled:opacity-50'
                      : 'cursor-not-allowed border-border bg-bg-2 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <PlatformIcon platform={p.slug} size={22} />
                    <span className="font-medium">{p.name}</span>
                  </span>
                  {ready ? (
                    <span className="text-sm text-primary">
                      {busy ? 'Redirecting…' : 'Connect'}
                    </span>
                  ) : (
                    <span className="rounded-badge bg-bg px-2 py-0.5 text-[11px] font-medium text-text-muted">
                      Coming soon
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
