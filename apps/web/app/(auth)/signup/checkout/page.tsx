'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { apiClient } from '@/lib/api/client';

type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'card';

const DEFAULT_UGX_RATE = 3_750;

async function fetchUGXRate(): Promise<number> {
  try {
    const res = await fetch('/api/v1/exchange-rates/UGX');
    if (res.ok) {
      const data = await res.json();
      return data.rate ?? DEFAULT_UGX_RATE;
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_UGX_RATE;
}

function formatUGX(usd: number, rate: number) {
  return new Intl.NumberFormat('en-UG').format(usd * rate);
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
  const userEmail = searchParams.get('email') || '';
  const userName = searchParams.get('name') || '';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [paymentState, setPaymentState] = useState<'idle' | 'verifying' | 'confirmed' | 'failed'>('idle');
  const [error, setError] = useState('');
  const [ugxRate, setUgxRate] = useState(DEFAULT_UGX_RATE);

  const totalAmount = billingCycle === 'annual' ? planPrice * 12 : planPrice;
  const nextRenewal = getNextRenewalDate(billingCycle);
  const cycleLabel = billingCycle === 'annual' ? 'Annual' : 'Monthly';

  useEffect(() => {
    fetchUGXRate().then(setUgxRate);
  }, []);

  // Determine which Flutterwave payment options to suggest based on user selection.
  // Flutterwave's modal handles ALL payment methods securely on their servers --
  // card data never touches our frontend or backend.
  const getPaymentOptions = (): string => {
    switch (paymentMethod) {
      case 'mtn_momo':
      case 'airtel_money':
        return 'mobilemoney';
      case 'card':
        return 'card';
      default:
        return 'card,mobilemoney,ussd';
    }
  };

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: `mm-${Date.now()}`,
    amount: totalAmount,
    currency: 'USD' as const,
    payment_options: getPaymentOptions(),
    customer: {
      email: userEmail,
      name: userName,
      phone_number: '',
    },
    customizations: {
      title: 'myManager',
      description: `${planName} Plan Subscription (${cycleLabel})`,
      logo: '',
    },
    meta: {
      plan: planName.toLowerCase(),
      billing_cycle: billingCycle,
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const handlePay = () => {
    setError('');

    if (!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY) {
      setError('Payment configuration error. Please contact support.');
      return;
    }

    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();

        if (response.status === 'successful') {
          setPaymentState('verifying');
          try {
            await apiClient.post('/billing/verify-payment', {
              transaction_id: response.transaction_id,
              tx_ref: response.tx_ref,
              plan: planName.toLowerCase(),
              billing_cycle: billingCycle,
            });
            setPaymentState('confirmed');
            setTimeout(() => router.push('/verify-email'), 1_200);
          } catch (err: any) {
            setPaymentState('failed');
            const msg = err?.error?.message || err?.message || 'Payment verification failed. Please contact support.';
            setError(msg);
          }
        } else {
          setPaymentState('failed');
          setError('Payment was not successful. Please try again.');
        }
      },
      onClose: () => {
        // User closed the modal without completing payment
      },
    });
  };

  const methods: { key: PaymentMethod; label: string }[] = [
    { key: 'mtn_momo', label: 'MTN MoMo' },
    { key: 'airtel_money', label: 'Airtel Money' },
    { key: 'card', label: 'Card' },
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
                ${totalAmount}.00
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

          {/* Payment States */}
          {paymentState === 'verifying' && (
            <div className="mt-4 flex items-center gap-2 rounded-input bg-bg-2 p-3">
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[12px] text-text-2">Verifying payment...</span>
            </div>
          )}

          {paymentState === 'confirmed' && (
            <div className="mt-4 rounded-input border border-green-300 bg-green-50 p-3 text-[12px] text-green-700">
              Payment confirmed! Redirecting...
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="mt-4 rounded-input border border-error bg-error-light p-3 text-[12px] text-error">
              Payment failed &mdash; try again or use a different method.
            </div>
          )}

          {/* Payment Method Info */}
          <div className="mt-5 space-y-4">
            {/* MTN MoMo */}
            {paymentMethod === 'mtn_momo' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFCC00] text-[#333]">
                    MTN
                  </span>
                  <span className="text-[13px] font-medium text-text">Mobile Money (Uganda)</span>
                </div>

                <div className="rounded-input bg-bg-2 p-3 text-[11px] text-text-2">
                  You will be prompted to enter your phone number and authorize the payment in the secure Flutterwave checkout window.
                </div>

                <p className="text-[12px] text-text font-medium">
                  Amount: UGX {formatUGX(totalAmount, ugxRate)}
                </p>

                <p className="text-[10px] text-text-muted">
                  Payments processed securely via Flutterwave. Your payment details never touch our servers.
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

                <div className="rounded-input bg-bg-2 p-3 text-[11px] text-text-2">
                  You will be prompted to enter your phone number and authorize the payment in the secure Flutterwave checkout window.
                </div>

                <p className="text-[12px] text-text font-medium">
                  Amount: UGX {formatUGX(totalAmount, ugxRate)}
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

                <div className="rounded-input bg-bg-2 p-3 text-[11px] text-text-2">
                  Card details are entered securely in the Flutterwave payment window. Your card information never touches our servers.
                </div>

                <p className="text-[10px] text-text-muted">
                  PCI-DSS compliant payments powered by Flutterwave.
                </p>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={paymentState === 'verifying' || paymentState === 'confirmed'}
              className="w-full bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-[11px] font-bold transition disabled:opacity-50"
            >
              {paymentState === 'verifying'
                ? 'Verifying...'
                : paymentState === 'confirmed'
                  ? 'Confirmed!'
                  : `Pay $${totalAmount}.00`}
            </button>
          </div>

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
