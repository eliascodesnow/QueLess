import { cn } from '@/lib/utils';

// The recurring visual device of the app: a torn-stub ticket, styled with
// the perforated edge from globals.css. Used both for a customer's own
// large position display and, in compact form, for rows in the business
// dashboard's waiting list. This is the piece that should make the product
// feel like it was designed around what a queue actually is (a ticket)
// rather than styled like a generic admin panel.

export function TicketLarge({
  position,
  label,
  sublabel,
}: {
  position: number | string;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="ticket-edge bg-paper-card border border-line rounded-md shadow-ticket px-8 py-10 text-center relative">
      <p className="text-[0.72rem] font-semibold uppercase tracking-widetrack text-ink/45 mb-3">
        {label}
      </p>
      <div className="font-display text-7xl tnum leading-none text-ink tightish">
        {position}
      </div>
      {sublabel && <p className="mt-4 text-sm text-ink/55">{sublabel}</p>}
    </div>
  );
}

export function TicketRow({
  position,
  name,
  status,
  meta,
  actions,
}: {
  position: number;
  name: string;
  status: 'waiting' | 'serving';
  meta?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 py-3.5 border-b border-line last:border-0',
        status === 'serving' && 'bg-teal-wash/40 -mx-4 px-4 rounded'
      )}
    >
      <div className="font-display text-2xl tnum text-ink/70 w-12 shrink-0 text-center">
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink truncate">{name}</p>
        {meta && <p className="text-xs text-ink/45 mt-0.5">{meta}</p>}
      </div>
      {actions}
    </div>
  );
}
