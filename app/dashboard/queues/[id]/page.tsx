import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { QueueLiveView } from './live-view';

export default async function QueueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: queue } = await supabase.from('queues').select('*').eq('id', id).single();
  if (!queue) notFound();

  const { data: entries } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('queue_id', id)
    .in('status', ['waiting', 'serving'])
    .order('position', { ascending: true });

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;
  const joinUrl = new URL(`/join/${queue.join_code}`, siteUrl).toString();
  const qrDataUrl = await QRCode.toDataURL(joinUrl, {
    margin: 1,
    width: 240,
    color: {
      dark: '#111111',
      light: '#ffffff',
    },
  });

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

      <QueueLiveView queue={queue} initialEntries={entries ?? []} joinUrl={joinUrl} qrDataUrl={qrDataUrl} />
    </div>
  );
}
