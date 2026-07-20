'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Accessible modal dialog.
 *
 * The app has ~14 hand-rolled overlays built from
 * `fixed inset-0 z-50 flex items-center justify-center bg-black/40` with no
 * dialog semantics and no keyboard handling at all
 * (docs/audit-2026-07-20.md §5.2). For a keyboard or screen-reader user that
 * means: focus stays on the page behind, Tab walks out of the dialog into
 * content that is visually covered, Escape does nothing, and nothing announces
 * that a dialog opened.
 *
 * This implements the four things a dialog must do:
 *  1. move focus in on open, and restore it to the trigger on close
 *  2. trap Tab/Shift+Tab within the dialog
 *  3. close on Escape
 *  4. lock background scroll
 *
 * Uses plain DOM rather than a headless library because the project has no
 * dialog dependency, and adding one for this would be a heavier change than the
 * component itself.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Footer actions, typically Buttons. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Set false for destructive flows where a stray click should not dismiss. */
  closeOnOverlayClick?: boolean;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (nodes.length === 0) {
        // Nothing focusable inside — keep focus on the panel rather than
        // letting Tab escape to the page behind.
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown, true);

    // Focus the first control, falling back to the panel itself.
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panelRef.current)?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = overflow;
      // Return focus to whatever opened the dialog, so keyboard users are not
      // dumped back at the top of the document.
      restoreFocusRef.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        // mousedown, not click: a drag that starts inside and ends on the
        // overlay should not close the dialog.
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'w-full rounded-card border border-border bg-bg-card shadow-lg outline-none',
          SIZES[size],
        )}
      >
        <div className="border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-[15px] font-semibold text-text">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1 text-[12px] text-text-2">
              {description}
            </p>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 text-sm text-text">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
