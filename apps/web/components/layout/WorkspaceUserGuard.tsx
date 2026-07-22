'use client';

import { useRef, type ReactNode } from 'react';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

/**
 * Binds the persisted workspace store to the current user BEFORE the dashboard
 * children mount their workspace-scoped queries. If a different user is now
 * signed in (e.g. re-login on a shared browser), the stale persisted
 * activeWorkspaceId is cleared here — during this component's render, so
 * children read the reset value on their first render and don't fire a request
 * against a workspace the new user can't access.
 */
export function WorkspaceUserGuard({ userId, children }: { userId: string; children: ReactNode }) {
  const syncUser = useWorkspaceStore((s) => s.syncUser);
  const applied = useRef<string | null>(null);
  if (applied.current !== userId) {
    applied.current = userId;
    syncUser(userId);
  }
  return <>{children}</>;
}
