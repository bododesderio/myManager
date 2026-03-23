'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useChangePassword,
  useDisableTwoFactor,
  useEnableTwoFactor,
  usePreferences,
  useVerifyTwoFactor,
} from '@/lib/hooks/useUser';
import { useToast } from '@/providers/ToastProvider';

export default function SecurityContent() {
  const { data: preferences, isLoading: isLoadingPreferences } = usePreferences();
  const changePassword = useChangePassword();
  const enableTwoFactor = useEnableTwoFactor();
  const verifyTwoFactor = useVerifyTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);

  useEffect(() => {
    if (preferences) {
      setTwoFAEnabled(Boolean((preferences as { totp_enabled?: boolean }).totp_enabled));
    }
  }, [preferences]);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      addToast({ type: 'error', message: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      addToast({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Password changed successfully.' });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: () => addToast({ type: 'error', message: 'Failed to change password. Check your current password.' }),
      },
    );
  };

  const handleToggle2FA = () => {
    if (twoFAEnabled) {
      return;
    }

    enableTwoFactor.mutate(undefined, {
      onSuccess: (data) => {
        setSetupData(data as { secret: string; qrCodeUrl: string; backupCodes: string[] });
        setShowSetup2FA(true);
      },
      onError: () => addToast({ type: 'error', message: 'Failed to start 2FA setup.' }),
    });
  };

  const handleComplete2FASetup = () => {
    if (verificationCode.length !== 6) {
      addToast({ type: 'error', message: 'Enter the 6-digit code from your authenticator app.' });
      return;
    }

    verifyTwoFactor.mutate(
      { code: verificationCode },
      {
        onSuccess: () => {
          setTwoFAEnabled(true);
          setShowSetup2FA(false);
          setVerificationCode('');
          addToast({ type: 'success', message: '2FA has been enabled.' });
        },
        onError: () => addToast({ type: 'error', message: 'The verification code is invalid.' }),
      },
    );
  };

  const handleDisable2FA = () => {
    if (disableCode.length !== 6) {
      addToast({ type: 'error', message: 'Enter your current 6-digit 2FA code to disable the feature.' });
      return;
    }

    disableTwoFactor.mutate(
      { code: disableCode },
      {
        onSuccess: () => {
          setTwoFAEnabled(false);
          setDisableCode('');
          addToast({ type: 'info', message: '2FA has been disabled.' });
        },
        onError: () => addToast({ type: 'error', message: 'The 2FA code is invalid.' }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Security</h1>

      <div className="max-w-2xl space-y-6">
        {/* Change Password */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Change Password</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="currentPw" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                id="currentPw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="newPw" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="newPw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirmPw" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                id="confirmPw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changePassword.isPending}
            className="mt-4 rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {changePassword.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Two-Factor Authentication</h2>
          <p className="mt-2 text-sm text-gray-500">Add an extra layer of security to your account.</p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                twoFAEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleToggle2FA}
              disabled={enableTwoFactor.isPending || isLoadingPreferences || twoFAEnabled}
              className={`rounded-brand px-4 py-2 text-sm font-medium transition ${
                twoFAEnabled
                  ? 'cursor-default border border-gray-300 text-gray-500'
                  : 'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white'
              }`}
            >
              {enableTwoFactor.isPending ? 'Starting...' : twoFAEnabled ? '2FA Active' : 'Enable 2FA'}
            </button>
          </div>

          {twoFAEnabled && (
            <div className="mt-4 rounded-brand border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-800">Disable Two-Factor Authentication</h3>
              <p className="mt-2 text-sm text-red-700">
                Enter a current authenticator code to turn 2FA off for this account.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div>
                  <label htmlFor="disable2faCode" className="block text-sm font-medium text-gray-700">Current 2FA Code</label>
                  <input
                    id="disable2faCode"
                    type="text"
                    inputMode="numeric"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 block w-48 rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleDisable2FA}
                  disabled={disableTwoFactor.isPending}
                  className="rounded-brand border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {disableTwoFactor.isPending ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          )}

          {showSetup2FA && (
            <div className="mt-4 rounded-brand border border-brand-primary/30 bg-brand-primary/5 p-4">
              <h3 className="text-sm font-semibold">Set up Two-Factor Authentication</h3>
              <p className="mt-2 text-sm text-gray-600">
                Add this setup key to your authenticator app, then enter the 6-digit code to finish setup.
              </p>
              <div className="mt-4 rounded-brand border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Setup Key</p>
                <p className="mt-2 break-all font-mono text-sm text-gray-800">{setupData?.secret ?? '--'}</p>
                {setupData?.qrCodeUrl && (
                  <a
                    href={setupData.qrCodeUrl}
                    className="mt-3 inline-block text-sm text-brand-primary hover:underline"
                  >
                    Open authenticator link
                  </a>
                )}
              </div>
              {!!setupData?.backupCodes?.length && (
                <div className="mt-4 rounded-brand border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Backup Codes</p>
                  <p className="mt-1 text-sm text-amber-800">Store these somewhere safe. Each code can be used once.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {setupData.backupCodes.map((code) => (
                      <code key={code} className="rounded bg-white px-2 py-1 font-mono text-sm text-gray-800">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="verifyCode" className="block text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  id="verifyCode"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="mt-1 block w-48 rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleComplete2FASetup}
                  disabled={verifyTwoFactor.isPending}
                  className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  {verifyTwoFactor.isPending ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  onClick={() => {
                    setShowSetup2FA(false);
                    setSetupData(null);
                    setVerificationCode('');
                  }}
                  className="rounded-brand border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Active Sessions</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-brand border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Current Session</p>
                <p className="text-xs text-gray-500">This device &middot; Active now</p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
