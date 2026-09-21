import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CreateQueueForm } from './create-queue-form';
import { StatusPill } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user!.id)
    .single();

  const businessId = membership?.business_id;

  const { data: queues } = await supabase
    .from('queues')
    .select('*, queue_entries(id, status)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const { data: stats } = await supabase
    .from('daily_stats')
    .select('served_count, no_show_count, total_wait_mins, queue_id')
    .eq('business_id', businessId)
    .eq('day', today);

  const servedToday = stats?.reduce((sum, s) => sum + s.served_count, 0) ?? 0;
  const totalWaitMins = stats?.reduce((sum, s) => sum + s.total_wait_mins, 0) ?? 0;
  const avgWait = servedToday > 0 ? Math.round(totalWaitMins / servedToday) : 0;
  const noShowToday = stats?.reduce((sum, s) => sum + s.no_show_count, 0) ?? 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display text-3xl">Your queues</h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Served today" value={servedToday} />
        <StatCard label="Average wait" value={avgWait ? `${avgWait} min` : '—'} />
        <StatCard label="No-shows today" value={noShowToday} />
      </div>

      <div className="grid md:grid-cols-[1fr,320px] gap-8">
        <div className="space-y-3">
          {(!queues || queues.length === 0) && (
            <p className="text-ink/50 text-sm py-8">
              No queues yet. Create your first one to get a shareable link and QR code.
            </p>
          )}
          {queues?.map((q) => {
            const waiting = (q.queue_entries as any[]).filter((e) => e.status === 'waiting').length;
            return (
              <Link
                key={q.id}
                href={`/dashboard/queues/${q.id}`}
                className="block bg-paper-card border border-line rounded-md p-5 hover:border-ink/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{q.name}</p>
                    <p className="text-sm text-ink/50 mt-0.5">
                      {waiting} waiting &middot; {q.join_code}
                    </p>
                  </div>
                  <StatusPill status={q.status} />
                </div>
              </Link>
            );
          })}
        </div>

        <CreateQueueForm />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-paper-card border border-line rounded-md p-5">
      <p className="text-xs uppercase tracking-widetrack text-ink/45 mb-2">{label}</p>
      <p className="font-display text-3xl tnum">{value}</p>
    </div>
  );
}
