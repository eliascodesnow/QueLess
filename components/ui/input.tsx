import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded border border-ink/20 bg-paper-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink/35',
        'focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30',
        'transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block text-[0.78rem] font-medium uppercase tracking-widetrack text-ink/50 mb-1.5', className)}>
      {children}
    </label>
  );
}
