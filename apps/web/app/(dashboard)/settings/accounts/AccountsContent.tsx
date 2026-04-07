'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useSocialAccounts, useDisconnectSocialAccount } from '@/lib/hooks/useSocialAccounts';
import { useToast } from '@/providers/ToastProvider';
import { ServiceUnavailableInline } from '@/components/status/ServiceUnavailable';

export default function AccountsContent() {
  const { data: accounts, isLoading } = useSocialAccounts();
  const disconnect = useDisconnectSocialAccount();
  const { addToast } = useToast();

  const handleDisconnect = (id: string, platform: string) => {
    if (!confirm(`Disconnect ${platform}? You will need to reconnect to manage this account.`)) return;
    disconnect.mutate(id, {
      onSuccess: () => addToast({ type: 'success', message: `${platform} disconnected.` }),
      onError: () => addToast({ type: 'error', message: `Failed to disconnect ${platform}.` }),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading accounts...</div>;
  }

  const accountList = (accounts as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Connected Accounts</h1>
        <Link
          href={"/connect/oauth" as Route}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Connect Account
        </Link>
      </div>

      {accountList.length === 0 ? (
        <div className="max-w-2xl rounded-brand border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">No social accounts connected yet.</p>
          <Link
            href={"/connect/oauth" as Route}
            className="mt-4 inline-block rounded-brand bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
          >
            Connect Your First Account
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl space-y-3">
          {accountList.map((account: any) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-brand border bg-white px-5 py-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{account.platform}</p>
                <p className="text-sm text-gray-500">
                  {account.username ?? account.account_name}
                  {account.connected_at && (
                    <span className="ml-2 text-xs text-gray-400">
                      Connected {new Date(account.connected_at).toLocaleDateString()}
                    </span>
                  )}
                </p>
                {account.status && (
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      account.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : account.status === 'expired'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {account.status}
                  </span>
                )}
                {account.status && account.status !== 'active' && (
                  <div className="mt-2">
                    <ServiceUnavailableInline
                      message={`${account.platform} token ${account.status}. Posts to this account are paused until you reconnect.`}
                      actionHref={`/connect/oauth?platform=${encodeURIComponent(account.platform)}`}
                      actionLabel="Reconnect"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDisconnect(account.id, account.platform)}
                disabled={disconnect.isPending}
                className="rounded-brand border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
