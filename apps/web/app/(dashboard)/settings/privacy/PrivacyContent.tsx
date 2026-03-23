'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/providers/ToastProvider';

export default function PrivacyContent() {
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportRequested, setExportRequested] = useState(false);

  const [cookieAnalytics, setCookieAnalytics] = useState(true);
  const [cookieMarketing, setCookieMarketing] = useState(false);

  const handleRequestExport = () => {
    setExportRequested(true);
    addToast({ type: 'success', message: 'Data export requested. You will receive an email when it is ready.' });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') {
      addToast({ type: 'error', message: 'Please type DELETE to confirm.' });
      return;
    }
    // In production this would call an API
    addToast({ type: 'success', message: 'Account deletion has been initiated.' });
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleSaveCookies = () => {
    addToast({ type: 'success', message: 'Cookie preferences saved.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-brand-primary hover:underline">&larr; Settings</Link>
      </div>
      <h1 className="font-heading text-2xl font-bold">Privacy</h1>

      <div className="max-w-2xl space-y-6">
        {/* Cookie Consent */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Cookie Consent</h2>
          <p className="mt-2 text-sm text-gray-500">Manage which cookies you allow on your device.</p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Essential Cookies</p>
                <p className="text-sm text-gray-500">Required for the app to function. Cannot be disabled.</p>
              </div>
              <input type="checkbox" checked disabled className="rounded border-gray-300" />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics Cookies</p>
                <p className="text-sm text-gray-500">Help us improve by sharing anonymous usage data.</p>
              </div>
              <button
                type="button"
                onClick={() => setCookieAnalytics(!cookieAnalytics)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  cookieAnalytics ? 'bg-brand-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    cookieAnalytics ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Cookies</p>
                <p className="text-sm text-gray-500">Receive tips, updates, and feature announcements.</p>
              </div>
              <button
                type="button"
                onClick={() => setCookieMarketing(!cookieMarketing)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  cookieMarketing ? 'bg-brand-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    cookieMarketing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
          <button
            onClick={handleSaveCookies}
            className="mt-4 rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Save Cookie Preferences
          </button>
        </div>

        {/* Data Export */}
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Data Export</h2>
          <p className="mt-2 text-sm text-gray-500">Download a copy of all your data.</p>
          <button
            onClick={handleRequestExport}
            disabled={exportRequested}
            className="mt-4 rounded-brand border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:opacity-50"
          >
            {exportRequested ? 'Export Requested' : 'Request Data Export'}
          </button>
        </div>

        {/* Delete Account */}
        <div className="rounded-brand border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-red-600">Delete Account</h2>
          <p className="mt-2 text-sm text-gray-500">
            Permanently delete your account and all data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete My Account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-red-700">
                Type <span className="font-bold">DELETE</span> to confirm account deletion.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="block w-48 rounded-brand border border-red-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  className="rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Permanently Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="rounded-brand border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
