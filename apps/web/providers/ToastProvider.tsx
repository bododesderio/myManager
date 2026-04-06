'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toast: (opts: { title: string; variant?: 'success' | 'error' | 'warning' | 'info' }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 5000;
    setToasts((prev) => [...prev, { ...toast, id }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: { title: string; variant?: 'success' | 'error' | 'warning' | 'info' }) => {
      addToast({ type: opts.variant ?? 'info', message: opts.title });
    },
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      {/* Toast display */}
      {toasts.length > 0 && (
        <div
          role="region"
          aria-label="Notifications"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        >
          {toasts.map((toast) => {
            const className = `rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
              toast.type === 'success'
                ? 'bg-green-600'
                : toast.type === 'error'
                  ? 'bg-red-600'
                  : toast.type === 'warning'
                    ? 'bg-yellow-600'
                    : 'bg-blue-600'
            }`;
            const inner = (
              <div className="flex items-center gap-2">
                <span>{toast.message}</span>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => removeToast(toast.id)}
                  className="ml-2 opacity-70 hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            );
            if (toast.type === 'error') {
              return (
                <div key={toast.id} role="alert" aria-live="assertive" aria-atomic="true" className={className}>
                  {inner}
                </div>
              );
            }
            return (
              <div key={toast.id} role="status" aria-live="polite" aria-atomic="true" className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}
