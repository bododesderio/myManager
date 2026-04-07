'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription, usePlans, useBillingHistory, useChangePlan, useCancelSubscription } from '@/lib/hooks/useBilling';
import { useToast } from '@/providers/ToastProvider';
import { useCapabilities } from '@/providers/CapabilitiesProvider';
import { ServiceUnavailable } from '@/components/status/ServiceUnavailable';

export default function BillingContent() {
  const caps = useCapabilities();
  if (!caps.payments.configured) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Billing</h1>
        <ServiceUnavailable
          title="Billing temporarily unavailable"
          message="The payment provider isn't configured yet. A superadmin needs to add Flutterwave credentials before billing can be enabled."
          actionHref="/superadmin/settings/credentials"
          actionLabel="Configure credentials"
        />
      </div>
    );
  }
  return <BillingContentInner />;
}

function BillingContentInner() {
  const { data: subscription, isLoading: loadingSub } = useSubscription();
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const { data: history, isLoading: loadingHistory } = useBillingHistory();
  const changePlan = useChangePlan();
  const cancelSub = useCancelSubscription();
  const { addToast } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const sub = subscription as any;
  const planList = (plans as any[]) ?? [];
  const invoices = (history as any[]) ?? [];

  const handleChangePlan = (planId: string) => {
    changePlan.mutate(
      { planId, interval: sub?.interval ?? 'monthly' },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Plan changed successfully.' }),
        onError: () => addToast({ type: 'error', message: 'Failed to change plan.' }),
      },
    );
  };

  const handleCancel = () => {
    cancelSub.mutate(undefined, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Subscription cancelled.' });
        setShowCancelConfirm(false);
      },
      onError: () => addToast({ type: 'error', message: 'Failed to cancel subscription.' }),
    });
  };

  const isLoading = loadingSub || loadingPlans || loadingHistory;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading billing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Billing</h1>

      <div className="max-w-3xl space-y-6">
        {/* Current Plan */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Current Plan</h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{sub?.plan_name ?? 'Free'}</p>
              <p className="text-sm text-gray-500">
                {sub?.price ? `$${sub.price}/${sub.interval ?? 'month'}` : 'No active subscription'}
                {sub?.current_period_end && (
                  <span> &middot; Renews {new Date(sub.current_period_end).toLocaleDateString()}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {sub?.status === 'active' && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="rounded-brand border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          {showCancelConfirm && (
            <div className="mt-4 rounded-brand border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Are you sure? Your subscription will remain active until the end of the current billing period.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelSub.isPending}
                  className="rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelSub.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="rounded-brand border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Plan comparison grid */}
        {planList.length > 0 && (
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Available Plans</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {planList.map((plan: any) => {
                const isCurrent = sub?.plan_id === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-brand border p-5 ${
                      isCurrent ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <h3 className="font-heading font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-2xl font-bold">
                      ${plan.price_monthly ?? plan.price}
                      <span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    {plan.features && (
                      <ul className="mt-3 space-y-1 text-sm text-gray-600">
                        {(plan.features as string[]).map((f: string) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <span className="text-green-600">&#10003;</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={isCurrent || changePlan.isPending}
                      className={`mt-4 w-full rounded-brand px-4 py-2 text-sm font-semibold transition ${
                        isCurrent
                          ? 'border border-brand-primary bg-white text-brand-primary cursor-default'
                          : 'bg-brand-primary text-white hover:bg-brand-primary-dark disabled:opacity-50'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : 'Switch to this plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Billing History</h2>
          {invoices.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No billing history yet.</p>
          ) : (
            <div className="mt-4 divide-y">
              {invoices.map((invoice: any) => (
                <div key={invoice.id ?? invoice.date} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(invoice.date ?? invoice.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${invoice.amount ?? invoice.total}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.invoice_url && (
                      <a
                        href={invoice.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-primary hover:underline"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
