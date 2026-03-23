'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'card' | 'google_pay';
type PollingState = 'idle' | 'polling' | 'confirmed' | 'failed' | 'timeout';

const UGX_RATE = 3_750; // placeholder conversion: 1 USD = 3,750 UGX

function formatUGX(usd: number) {
  return new Intl.NumberFormat('en-UG').format(usd * UGX_RATE);
}

function getNextRenewalDate(cycle: string): string {
  const now = new Date();
  if (cycle === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-sm text-text-2">Loading checkout...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Plan info from query params (fallback defaults)
  const planName = searchParams.get('plan') || 'Starter';
  const planPrice = Number(searchParams.get('price') || '15');
  const billingCycle = searchParams.get('cycle') || 'monthly';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [pollingState, setPollingState] = useState<PollingState>('idle');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextRenewal = getNextRenewalDate(billingCycle);
  const cycleLabel = billingCycle === 'annual' ? 'Annual' : 'Monthly';

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startPolling = useCallback(() => {
    setPollingState('polling');
    setError('');

    // 2-minute timeout
    timeoutRef.current = setTimeout(() => {
      cleanup();
      setPollingState('timeout');
    }, 120_000);

    // Poll every 3 seconds
    pollRef.current = setInterval(async () => {
      try {
        const data = await apiClient.get<{ status: string }>('/auth/payment-status');
        if (data.status === 'CONFIRMED') {
          cleanup();
          setPollingState('confirmed');
          // Auto-redirect to verify-email
          setTimeout(() => router.push('/verify-email'), 1_200);
        } else if (data.status === 'FAILED') {
          cleanup();
          setPollingState('failed');
        }
      } catch {
        // Silently retry on network errors
      }
    }, 3_000);
  }, [cleanup, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: Record<string, string> = {
      plan: planName.toLowerCase(),
      billing_cycle: billingCycle,
      payment_method: paymentMethod,
    };

    if (paymentMethod === 'mtn_momo' || paymentMethod === 'airtel_money') {
      if (!phone) {
        setError('Phone number is required.');
        return;
      }
      payload.phone = phone;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !expiry || !cvv) {
        setError('Please fill in all card details.');
        return;
      }
      payload.card_number = cardNumber;
      payload.expiry = expiry;
      payload.cvv = cvv;
    }

    try {
      await apiClient.post('/auth/initiate-payment', payload);
      startPolling();
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Payment initiation failed. Please try again.';
      setError(msg);
    }
  };

  const methods: { key: PaymentMethod; label: string }[] = [
    { key: 'mtn_momo', label: 'MTN MoMo' },
    { key: 'airtel_money', label: 'Airtel Money' },
    { key: 'card', label: 'Card' },
    { key: 'google_pay', label: 'Google Pay' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-primary min-h-screen p-10 flex-col justify-between">
        <div>
          <span className="text-white font-bold text-[14px]">myManager</span>
        </div>

        <div>
          <h2 className="text-[24px] font-bold text-white">Order summary</h2>
          <div className="mt-6 bg-white/10 rounded-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/80">Plan</span>
              <span className="text-[13px] text-white font-semibold">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/80">Price</span>
              <span className="text-[13px] text-white font-semibold">${planPrice}/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/80">Billing cycle</span>
              <span className="text-[13px] text-white font-semibold">{cycleLabel}</span>
            </div>
            <div className="h-px bg-white/20" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/80">Next renewal</span>
              <span className="text-[13px] text-white font-semibold">{nextRenewal}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} MyManager Ltd</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[320px]">
          {/* Header */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Payment
          </p>
          <h2 className="mt-1 text-[22px] font-bold text-text">
            Complete your subscription
          </h2>
          <p className="mt-1 text-[13px] text-text-2">
            {planName} plan &middot; {cycleLabel} billing
          </p>

          {/* Order Summary Box */}
          <div className="mt-6 bg-bg-2 rounded-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-2">Plan</span>
              <span className="text-[12px] text-text font-medium">{planName} &mdash; ${planPrice}/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-2">Billing cycle</span>
              <span className="text-[12px] text-text font-medium">{cycleLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-2">Next renewal</span>
              <span className="text-[12px] text-text font-medium">{nextRenewal}</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text font-bold">Total today</span>
              <span className="text-[13px] text-text font-bold">
                ${billingCycle === 'annual' ? planPrice * 12 : planPrice}.00
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mt-5 flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setPaymentMethod(m.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                  paymentMethod === m.key
                    ? 'bg-primary text-white'
                    : 'border border-border text-text-2 hover:border-primary/40'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-input border border-error bg-error-light p-3 text-[12px] text-error">
              {error}
            </div>
          )}

          {/* Polling States */}
          {pollingState === 'polling' && (
            <div className="mt-4 flex items-center gap-2 rounded-input bg-bg-2 p-3">
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[12px] text-text-2">Waiting for confirmation...</span>
            </div>
          )}

          {pollingState === 'confirmed' && (
            <div className="mt-4 rounded-input border border-green-300 bg-green-50 p-3 text-[12px] text-green-700">
              Payment confirmed! Redirecting...
            </div>
          )}

          {pollingState === 'failed' && (
            <div className="mt-4 rounded-input border border-error bg-error-light p-3 text-[12px] text-error">
              Payment failed &mdash; try again or use a different method.
            </div>
          )}

          {pollingState === 'timeout' && (
            <div className="mt-4 rounded-input border border-warning bg-warning-light p-3 text-[12px] text-warning">
              Taking longer than expected &mdash; check your balance and try again.
            </div>
          )}

          {/* Payment Forms */}
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {/* MTN MoMo */}
            {paymentMethod === 'mtn_momo' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFCC00] text-[#333]">
                    MTN
                  </span>
                  <span className="text-[13px] font-medium text-text">Mobile Money (Uganda)</span>
                </div>

                <div>
                  <label htmlFor="momo-phone" className="block text-[11px] font-medium text-text-2 mb-1">
                    Phone number (+256)
                  </label>
                  <input
                    id="momo-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                    className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    disabled={pollingState === 'polling'}
                  />
                </div>

                <div className="rounded-input bg-bg-2 p-3 text-[11px] text-text-2">
                  You will receive a USSD prompt on your phone. Enter your MTN MoMo PIN to confirm the payment.
                </div>

                <p className="text-[12px] text-text font-medium">
                  Amount: UGX {formatUGX(billingCycle === 'annual' ? planPrice * 12 : planPrice)}
                </p>

                <p className="text-[10px] text-text-muted">
                  Payments processed securely via Flutterwave. Your phone number is only used to initiate the transaction.
                </p>
              </div>
            )}

            {/* Airtel Money */}
            {paymentMethod === 'airtel_money' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#ED1C24] text-white">
                    Airtel
                  </span>
                  <span className="text-[13px] font-medium text-text">Airtel Money (Uganda)</span>
                </div>

                <div>
                  <label htmlFor="airtel-phone" className="block text-[11px] font-medium text-text-2 mb-1">
                    Phone number (+256)
                  </label>
                  <input
                    id="airtel-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                    className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    disabled={pollingState === 'polling'}
                  />
                </div>

                <div className="rounded-input bg-bg-2 p-3 text-[11px] text-text-2">
                  You will receive a USSD prompt on your phone. Enter your Airtel Money PIN to confirm.
                </div>

                <p className="text-[12px] text-text font-medium">
                  Amount: UGX {formatUGX(billingCycle === 'annual' ? planPrice * 12 : planPrice)}
                </p>

                <p className="text-[10px] text-text-muted">
                  Payments processed securely via Flutterwave.
                </p>
              </div>
            )}

            {/* Card */}
            {paymentMethod === 'card' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-text">Visa / Mastercard</span>
                </div>

                <div>
                  <label htmlFor="card-number" className="block text-[11px] font-medium text-text-2 mb-1">
                    Card number
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                    maxLength={19}
                    className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    disabled={pollingState === 'polling'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="card-expiry" className="block text-[11px] font-medium text-text-2 mb-1">
                      Expiry
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      maxLength={5}
                      className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      disabled={pollingState === 'polling'}
                    />
                  </div>
                  <div>
                    <label htmlFor="card-cvv" className="block text-[11px] font-medium text-text-2 mb-1">
                      CVV
                    </label>
                    <input
                      id="card-cvv"
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                      className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      disabled={pollingState === 'polling'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Google Pay */}
            {paymentMethod === 'google_pay' && (
              <div className="rounded-input bg-bg-2 p-4 text-center">
                <p className="text-[13px] text-text-2">
                  You will be redirected to Google Pay to complete the payment.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pollingState === 'polling' || pollingState === 'confirmed'}
              className="w-full bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-[11px] font-bold transition disabled:opacity-50"
            >
              {pollingState === 'polling'
                ? 'Processing...'
                : pollingState === 'confirmed'
                  ? 'Confirmed!'
                  : 'Confirm payment'}
            </button>
          </form>

          {/* Terms */}
          <p className="text-[10px] text-text-muted text-center mt-4">
            By completing this payment you agree to our{' '}
            <a href="/legal/terms" className="underline">Terms of Service</a>{' '}
            and{' '}
            <a href="/legal/privacy" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
