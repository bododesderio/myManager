'use client';

import { useSession } from 'next-auth/react';
import { useEffect, type ReactNode } from 'react';
import { setAccessToken, markAuthSettled } from '@/lib/api/client';

export function AuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Once the session status is known (authenticated or not), publish the token
    // and release the apiClient auth gate. Until then, authenticated requests
    // wait rather than firing tokenless and 401-ing on a cold page load.
    if (status === 'loading') return;
    setAccessToken(session?.accessToken ?? null);
    markAuthSettled();
  }, [status, session?.accessToken]);

  return <>{children}</>;
}
