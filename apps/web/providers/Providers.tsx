'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from './SessionProvider';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';
import { AuthSync } from './AuthSync';
import { SocketProvider } from './SocketProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>
        <QueryProvider>
          <SocketProvider>
            <ToastProvider>{children}</ToastProvider>
          </SocketProvider>
        </QueryProvider>
      </AuthSync>
    </SessionProvider>
  );
}
