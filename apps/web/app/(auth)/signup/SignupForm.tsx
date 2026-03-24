'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AccountType = 'individual' | 'company';
type Step = 1 | 2 | 3 | 4;

const COUNTRIES = ['Uganda', 'Kenya', 'Nigeria', 'Tanzania', 'Ghana', 'Other'];
const TEAM_SIZES = ['Just me', '2–5', '6–15', '16–50', '50+'];
const INDUSTRIES = ['Marketing Agency', 'E-commerce', 'Technology', 'Media', 'Education', 'Healthcare', 'Finance', 'Other'];

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');

  // Step 2 fields (company only)
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [industry, setIndustry] = useState('');
  const [referralSource, setReferralSource] = useState('');

  // Step 3 fields
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [resendingVerification, setResendingVerification] = useState(false);

  const totalSteps = accountType === 'company' ? 4 : 3;

  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType,
          firstName,
          lastName,
          email,
          password,
          country,
          companyName: accountType === 'company' ? companyName : undefined,
          workspaceName: accountType === 'company' ? workspaceName : undefined,
          workspaceSlug: accountType === 'company' ? workspaceSlug : undefined,
          industry: accountType === 'company' ? industry : undefined,
          teamSize: accountType === 'company' ? teamSize : undefined,
          referralSource,
          planSlug: selectedPlan,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setStep((accountType === 'company' ? 4 : 3) as Step);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendingVerification(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && accountType === 'individual') {
      // Individual skips step 2, goes to plan selection
      setStep(2 as Step);
    } else if (step === (accountType === 'company' ? 3 : 2)) {
      handleSubmit();
    } else {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => setStep((step - 1) as Step);

  const isStep1Valid = firstName && lastName && email && password.length >= 8 && country;

  return (
    <div className="w-full max-w-md">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {/* Step 1: Account details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                <p className="text-sm text-gray-500 mt-1">Get started with MyManager</p>
              </div>

              {/* Account type toggle */}
              <div className="grid grid-cols-2 gap-3">
                {(['individual', 'company'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAccountType(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      accountType === type
                        ? 'border-[#7F77DD] bg-[#7F77DD]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 capitalize">{type === 'individual' ? 'Individual / Creator' : 'Company / Agency'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {type === 'individual' ? 'Personal social media management' : 'Team collaboration & client management'}
                    </p>
                  </button>
                ))}
              </div>

              {accountType === 'company' && (
                <input
                  type="text"
                  placeholder="Company / Agency name"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (!workspaceName) setWorkspaceName(`${e.target.value} Workspace`);
                    if (!workspaceSlug) setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent" />
                <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent" />
              </div>

              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent" />

              <div>
                <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent" />
                {password && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${
                        passwordStrength() >= i
                          ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : 'bg-green-400'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {accountType === 'company' && (
                <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent">
                  <option value="">Team size</option>
                  {TEAM_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}

              <button
                onClick={nextStep}
                disabled={!isStep1Valid}
                className="w-full py-2.5 bg-[#7F77DD] text-white rounded-lg font-medium text-sm hover:bg-[#5B54A6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-[#7F77DD] hover:underline">Log in</Link>
              </p>
            </div>
          )}

          {/* Step 2: Workspace setup (company only) */}
          {step === 2 && accountType === 'company' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Set up your workspace</h1>
                <p className="text-sm text-gray-500 mt-1">This is where your team will collaborate</p>
              </div>

              <input type="text" placeholder="Workspace name" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent" />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Workspace URL</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <span className="px-3 bg-gray-50 text-sm text-gray-400 border-r border-gray-300 py-2.5">mymanager.com/</span>
                  <input type="text" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                </div>
              </div>

              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent">
                <option value="">Industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>

              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">
                You&apos;ll be registered as Workspace Owner with full admin rights.
              </div>

              <div className="flex gap-3">
                <button onClick={prevStep} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Back</button>
                <button onClick={nextStep} className="flex-1 py-2.5 bg-[#7F77DD] text-white rounded-lg font-medium text-sm hover:bg-[#5B54A6]">Continue</button>
              </div>
            </div>
          )}

          {/* Step 2/3: Plan selection */}
          {((step === 2 && accountType === 'individual') || (step === 3 && accountType === 'company')) && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Choose your plan</h1>
                <p className="text-sm text-gray-500 mt-1">Start free, upgrade anytime</p>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm">
                <span className={billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className={`relative w-11 h-6 rounded-full transition-colors ${billingCycle === 'annual' ? 'bg-[#7F77DD]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={billingCycle === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}>Annual <span className="text-green-600 text-xs">-22%</span></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { slug: 'free', name: 'Free', price: 0, features: ['3 social accounts', '10 posts/month', '500MB storage', 'Basic analytics'] },
                  { slug: 'starter', name: 'Starter', price: billingCycle === 'monthly' ? 15 : 12, features: ['10 social accounts', '100 posts/month', '5GB storage', 'Advanced analytics'] },
                  { slug: 'pro', name: 'Pro', price: billingCycle === 'monthly' ? 39 : 30, features: ['25 social accounts', 'Unlimited posts', '25GB storage', 'AI credits included'] },
                  { slug: 'enterprise', name: 'Enterprise', price: billingCycle === 'monthly' ? 99 : 77, features: ['Unlimited accounts', 'Unlimited posts', '100GB storage', 'Team features + API'] },
                ].map((plan) => (
                  <button
                    key={plan.slug}
                    onClick={() => setSelectedPlan(plan.slug)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPlan === plan.slug ? 'border-[#7F77DD] bg-[#7F77DD]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-500">{'\u2713'} {f}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                MTN MoMo &middot; Airtel Money &middot; Visa/Mastercard &middot; Google Pay &middot; Apple Pay
              </p>

              <div className="flex gap-3">
                <button onClick={prevStep} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Back</button>
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#7F77DD] text-white rounded-lg font-medium text-sm hover:bg-[#5B54A6] disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : selectedPlan === 'free' ? 'Start for free \u2192' : 'Continue to payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3/4: Email verification */}
          {((step === 3 && accountType === 'individual') || (step === 4 && accountType === 'company')) && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto bg-[#7F77DD]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#7F77DD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
                <p className="text-sm text-gray-500 mt-2">
                  We&apos;ve sent a verification link to <strong>{email}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-sm text-[#7F77DD] hover:underline disabled:opacity-50"
              >
                {resendingVerification ? 'Resending verification email...' : 'Resend verification email'}
              </button>
              <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg">
                Tip: Open the verification link on the same device for a seamless experience.
              </div>
            </div>
          )}
    </div>
  );
}
