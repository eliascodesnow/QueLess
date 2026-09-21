import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { QueueLiveView } from './live-view';

export default async function QueueDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: queue } = await supabase.from('queues').select('*').eq('id', params.id).single();
  if (!queue) notFound();

  const { data: entries } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('queue_id', params.id)
    .in('status', ['waiting', 'serving'])
    .order('position', { ascending: true });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const joinUrl = `${siteUrl}/join/${queue.join_code}`;

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-ink/50 hover:text-ink">
        ← All queues
      </Link>
      <h1 className="font-display text-3xl mt-2 mb-1">{queue.name}</h1>
      <p className="text-ink/55 text-sm mb-8">
        {queue.description || 'No description'} &middot; avg {queue.avg_service_time_mins} min per
        customer
      </p>

      <QueueLiveView queue={queue} initialEntries={entries ?? []} joinUrl={joinUrl} />
    </div>
  );
}
