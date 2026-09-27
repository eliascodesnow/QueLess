import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { JoinForm } from './join-form';

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: queue } = await supabase
    .from('queues')
    .select('*, businesses(name)')
    .eq('join_code', code)
    .single();

  if (!queue) notFound();

  const { count: waitingCount } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('queue_id', queue.id)
    .eq('status', 'waiting');

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="font-display text-2xl tracking-tightish mb-8">Foleni</p>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="w-full">
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
              <JoinForm joinCode={code} />
            ) : (
              <p className="text-terracotta-dark text-sm text-center">
                This queue isn&apos;t accepting new customers right now.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">How it works</p>
            <div className="mt-5 space-y-4">
              <Step n="1" title="Scan or type the code" body="Use the QR code at the business or enter the queue code to open this line." />
              <Step n="2" title="Add your name" body="Customers join in seconds from any phone without creating an account or downloading anything." />
              <Step n="3" title="Track your place" body="The live queue updates automatically so you know when it is your turn to be called." />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-sm font-semibold text-terracotta">
        {n}
      </div>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">{body}</p>
      </div>
    </div>
  );
}
