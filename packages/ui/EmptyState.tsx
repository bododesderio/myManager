import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Empty state.
 *
 * Replaces `rounded-brand border bg-white py-16 text-center shadow-sm` (11 uses)
 * and gives the many list pages that currently render nothing at all a
 * consistent, themed placeholder. The audit found empty states were
 * "inconsistently implemented" — most pages showed a blank area or a spinner
 * that never resolved (docs/audit-2026-07-20.md §5.2).
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Decorative; hidden from assistive tech. */
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-bg-card px-6 py-16 text-center shadow-sm',
        className,
      )}
    >
      {icon && (
        <div className="text-text-muted" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-text">{title}</h3>
      {description && <p className="max-w-sm text-[13px] text-text-2">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
