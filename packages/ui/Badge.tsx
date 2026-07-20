import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Status badge. The app renders post status (13 states), subscription status and
 * platform labels as ad-hoc coloured pills, mostly with hardcoded Tailwind
 * palette colours that do not adapt to the dark theme.
 */
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, string> = {
  neutral: 'bg-bg-2 text-text-2 border-border',
  primary: 'bg-primary-light text-primary border-primary-border',
  success: 'bg-accent-light text-accent border-accent-border',
  warning: 'bg-warning-light text-warning border-warning',
  error: 'bg-error-light text-error border-error',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-badge border px-2 py-0.5 text-[11px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
