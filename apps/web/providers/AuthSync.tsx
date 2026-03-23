'use client';

import { useSession } from 'next-auth/react';
import { useEffect, type ReactNode } from 'react';
import { setAccessToken } from '@/lib/api/client';

export function AuthSync({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

  return <>{children}</>;
}
