'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { connectSocket, disconnectSocket, getSocket } from './client';

export function useSocket() {
  const { data: session } = useSession();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (session?.accessToken && !connectedRef.current) {
      connectSocket();
      connectedRef.current = true;
    }

    return () => {
      if (connectedRef.current) {
        disconnectSocket();
        connectedRef.current = false;
      }
    };
  }, [session?.accessToken]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = getSocket();
    socket?.on(event, handler);
    return () => { socket?.off(event, handler); };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const socket = getSocket();
    socket?.emit(event, data);
  }, []);

  return { on, emit, socket: getSocket() as any };
}
