import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/**
 * Form primitives.
 *
 * The hand-written input class (44 uses) was:
 *   "mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2
 *    focus:border-brand-primary focus:outline-none"
 *
 * Three problems, all fixed here:
 *  - `border-gray-300` and the implicit white background are light-mode only.
 *  - `focus:outline-none` removes the focus ring and replaces it with a border
 *    colour change — a WCAG 2.4.7 failure, and invisible to anyone who cannot
 *    distinguish those two greys.
 *  - Labels were associated by hand, inconsistently. Field wires
 *    label/description/error to the control via useId, so the association
 *    cannot be forgotten.
 */

const CONTROL_BASE = cn(
  'block w-full rounded-input border border-border bg-bg px-4 py-2 text-sm text-text',
  'placeholder:text-text-muted',
  'transition-colors duration-150',
  // A real focus ring, not a border-colour swap.
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:outline-error',
);

export interface FieldProps {
  label: ReactNode;
  /** Helper text. Linked via aria-describedby. */
  description?: ReactNode;
  /** Error message. Sets aria-invalid and takes precedence over description. */
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Receives the wiring the control needs. */
  children: (ids: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    required: boolean | undefined;
  }) => ReactNode;
}

export function Field({ label, description, error, required, className, children }: FieldProps) {
  const id = useId();
  const descId = `${id}-desc`;
  const errId = `${id}-err`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-text">
        {label}
        {required && (
          <span className="ml-0.5 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        'aria-describedby': error ? errId : description ? descId : undefined,
        'aria-invalid': error ? true : undefined,
        required: required || undefined,
      })}

      {description && !error && (
        <p id={descId} className="text-[12px] text-text-2">
          {description}
        </p>
      )}
      {error && (
        // role="alert" so the message is announced when it appears after submit.
        <p id={errId} role="alert" className="text-[12px] text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL_BASE, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(CONTROL_BASE, 'min-h-24 resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(CONTROL_BASE, 'pr-8', className)} {...props}>
        {children}
      </select>
    );
  },
);
