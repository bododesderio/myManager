import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/**
 * Button.
 *
 * Replaces ~90 hand-written button class strings in apps/web, which had already
 * drifted into two incompatible "primary" styles:
 *   rounded-lg  bg-[var(--color-primary)] px-6 py-2.5   (34 uses)
 *   rounded-brand bg-brand-primary        px-4 py-2     (21 uses)
 * plus a secondary built from `border-gray-300 text-gray-700 hover:bg-gray-50`
 * (35 uses) that is invisible-adjacent in dark mode.
 *
 * Every colour here is a theme token, so the same markup works in light and dark
 * without the caller thinking about it.
 */

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark disabled:hover:bg-primary',
  secondary:
    'border border-border bg-bg text-text hover:bg-bg-2 disabled:hover:bg-bg',
  outline:
    'border border-primary text-primary hover:bg-primary hover:text-white disabled:hover:bg-transparent disabled:hover:text-primary',
  ghost:
    'text-text-2 hover:bg-bg-2 hover:text-text disabled:hover:bg-transparent',
  danger:
    'bg-error text-white hover:opacity-90 disabled:hover:opacity-100',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks interaction. Implies disabled. */
  loading?: boolean;
  /** Rendered before the label; hidden from assistive tech. */
  leadingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      // Defaulting to "button" prevents the classic bug of a button inside a
      // form submitting it because `type` was omitted.
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-btn font-medium',
        'transition-colors duration-200',
        // Visible keyboard focus. The hand-written buttons had none, which is a
        // WCAG 2.4.7 failure — keyboard users could not see where they were.
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        leadingIcon && <span aria-hidden="true">{leadingIcon}</span>
      )}
      {children}
    </button>
  );
});
