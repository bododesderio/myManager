'use client';

import { useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { connectSocket, disconnectSocket } from '@/lib/socket/client';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.accessToken) {
      connectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [session?.accessToken]);

  return <>{children}</>;
}
