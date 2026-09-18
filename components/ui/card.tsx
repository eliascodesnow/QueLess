import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-paper-card border border-line rounded-md shadow-card p-6', className)}>
      {children}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  open: 'bg-teal-wash text-teal-dark',
  waiting: 'bg-terracotta-wash text-terracotta-dark',
  serving: 'bg-teal-wash text-teal-dark',
  paused: 'bg-ink/10 text-ink/60',
  closed: 'bg-ink/10 text-ink/60',
  served: 'bg-ink/5 text-ink/40',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-widetrack',
        statusStyles[status] ?? 'bg-ink/10 text-ink/60'
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
