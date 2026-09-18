import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { JoinForm } from './join-form';

export default async function JoinPage({ params }: { params: { code: string } }) {
  const supabase = createClient();

  const { data: queue } = await supabase
    .from('queues')
    .select('*, businesses(name)')
    .eq('join_code', params.code)
    .single();

  if (!queue) notFound();

  const { count: waitingCount } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('queue_id', queue.id)
    .eq('status', 'waiting');

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl tracking-tightish mb-8">Foleni</p>

        <div className="ticket-edge bg-paper-card border border-line rounded-md shadow-ticket px-7 py-8 mb-6">
          <p className="text-xs uppercase tracking-widetrack text-ink/45 mb-1">
            {(queue.businesses as any)?.name}
          </p>
          <h1 className="font-display text-2xl mb-3">{queue.name}</h1>
          {queue.description && <p className="text-sm text-ink/55 mb-4">{queue.description}</p>}
          <p className="text-sm text-ink/70">
            <span className="font-semibold tnum">{waitingCount ?? 0}</span> people waiting &middot; ~
            {queue.avg_service_time_mins} min each
          </p>
        </div>

        {queue.status === 'open' ? (
          <JoinForm joinCode={params.code} />
        ) : (
          <p className="text-terracotta-dark text-sm text-center">
            This queue isn&apos;t accepting new customers right now.
          </p>
        )}
      </div>
    </main>
  );
}
