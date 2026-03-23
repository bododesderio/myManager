import { getErrorMessage } from './error-messages';

// These functions need the toast context. They're convenience wrappers
// used inside components that have access to useToast().
// For use outside React components, import and call addToast directly.

export function createToastHelpers(addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void) {
  return {
    success: (message: string) => addToast({ type: 'success', message }),
    error: (error: unknown) => addToast({ type: 'error', message: getErrorMessage(error) }),
    warning: (message: string) => addToast({ type: 'warning', message }),
    info: (message: string) => addToast({ type: 'info', message }),
  };
}
