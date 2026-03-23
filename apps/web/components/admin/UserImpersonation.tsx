'use client';

import { useState, type FormEvent } from 'react';

interface UserImpersonationProps {
  currentAdminName: string;
  onImpersonate?: (userId: string) => void;
  onStopImpersonation?: () => void;
  isImpersonating?: boolean;
  impersonatedUser?: { id: string; name: string; email: string } | null;
}

export function UserImpersonation({
  currentAdminName,
  onImpersonate,
  onStopImpersonation,
  isImpersonating = false,
  impersonatedUser = null,
}: UserImpersonationProps) {
  const [userId, setUserId] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      onImpersonate?.(userId.trim());
      setUserId('');
    }
  };

  if (isImpersonating && impersonatedUser) {
    return (
      <div className="rounded-brand border-2 border-orange-400 bg-orange-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-800">
              Impersonating User
            </p>
            <p className="text-sm text-orange-700">
              {impersonatedUser.name} ({impersonatedUser.email})
            </p>
            <p className="mt-1 text-xs text-orange-600">
              Logged in as admin: {currentAdminName}
            </p>
          </div>
          <button
            onClick={onStopImpersonation}
            className="rounded-brand bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Stop Impersonation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-brand border bg-white p-4">
      <h3 className="font-heading text-sm font-semibold">Impersonate User</h3>
      <p className="mt-1 text-xs text-gray-500">
        View the app as a specific user. All actions will be logged.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID or email..."
          className="flex-1 rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!userId.trim()}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          Impersonate
        </button>
      </form>
    </div>
  );
}
