import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/**
 * Card — the single most duplicated surface in the app.
 *
 *   "rounded-brand border bg-white p-6 shadow-sm"   67 uses
 *   "rounded-brand border bg-white p-5 shadow-sm"   33 uses
 *
 * Both hardcode `bg-white`, so every card renders as a white slab on the dark
 * theme's #0F172A background — and where the card's text uses a theme token,
 * light text lands on white and disappears entirely. Using `bg-bg-card` fixes
 * all 100 instances at once as they migrate.
 */

type Padding = 'none' | 'sm' | 'md' | 'lg';

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  /** Adds hover elevation. Only use when the whole card is a link or button. */
  interactive?: boolean;
  /** Renders as <section>/<article> etc. when the card is a landmark. */
  as?: 'div' | 'section' | 'article' | 'li';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'lg', interactive = false, as: Tag = 'div', className, children, ...props },
  ref,
) {
  // `as` is intentionally narrow (div/section/article/li). Those element types
  // have incompatible event-handler signatures, so the shared prop type is
  // expressed against HTMLElement and narrowed at the call site here. This is
  // the one cast in the package, and it is contained to a single line.
  const Component = Tag as 'div';

  return (
    <Component
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-bg-card shadow-sm',
        PADDING[padding],
        interactive &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned control, e.g. a Button. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold text-text">{title}</h3>
        {description && <p className="mt-1 text-[12px] text-text-2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
