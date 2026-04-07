'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from './SessionProvider';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';
import { AuthSync } from './AuthSync';
import { SocketProvider } from './SocketProvider';
import { CapabilitiesProvider } from './CapabilitiesProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>
        <QueryProvider>
          <CapabilitiesProvider>
            <SocketProvider>
              <ToastProvider>{children}</ToastProvider>
            </SocketProvider>
          </CapabilitiesProvider>
        </QueryProvider>
      </AuthSync>
    </SessionProvider>
  );
}
