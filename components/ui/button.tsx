import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'default' | 'sm' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Intentionally square-ish corners (5px, not 12px) and a hairline border
// rather than a floating shadow-only card look. Reads as a printed label
// more than a floating app chip.
const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-paper border border-ink hover:bg-ink/90 active:scale-[0.98]',
  secondary:
    'bg-transparent text-ink border border-ink/25 hover:border-ink/50 active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink/70 hover:text-ink hover:bg-ink/5',
  danger:
    'bg-transparent text-terracotta-dark border border-terracotta/40 hover:bg-terracotta-wash',
};

const sizes: Record<Size, string> = {
  default: 'px-5 py-2.5 text-[0.95rem]',
  sm: 'px-3.5 py-1.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium tracking-tightish transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
