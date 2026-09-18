'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { callNextAction, markEntryAction, updateQueueStatusAction } from '../../queue-actions';
import { Button } from '@/components/ui/button';
import { Card, StatusPill } from '@/components/ui/card';
import { TicketRow } from '@/components/ticket';
import type { Database } from '@/database.types';

type Queue = Database['public']['Tables']['queues']['Row'];
type Entry = Database['public']['Tables']['queue_entries']['Row'];

export function QueueLiveView({
  queue,
  initialEntries,
  joinUrl,
}: {
  queue: Queue;
  initialEntries: Entry[];
  joinUrl: string;
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [status, setStatus] = useState(queue.status);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`queue-${queue.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries', filter: `queue_id=eq.${queue.id}` },
        async () => {
          const { data } = await supabase
            .from('queue_entries')
            .select('*')
            .eq('queue_id', queue.id)
            .in('status', ['waiting', 'serving'])
            .order('position', { ascending: true });
          setEntries(data ?? []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue.id]);

  const serving = entries.filter((e) => e.status === 'serving');
  const waiting = entries.filter((e) => e.status === 'waiting');

  async function handleStatus(next: 'open' | 'paused' | 'closed') {
    setStatus(next);
    await updateQueueStatusAction(queue.id, next);
  }

  return (
    <div className="grid md:grid-cols-[1fr,320px] gap-8">
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-ink/50">Queue status</span>
            <StatusPill status={status} />
          </div>
          <div className="flex gap-2 mt-4">
            {status !== 'open' && (
              <Button size="sm" onClick={() => handleStatus('open')}>
                Open
              </Button>
            )}
            {status === 'open' && (
              <Button size="sm" variant="secondary" onClick={() => handleStatus('paused')}>
                Pause
              </Button>
            )}
            <Button size="sm" variant="danger" onClick={() => handleStatus('closed')}>
              Close
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-xl mb-4">Now serving</h2>
          {serving.length === 0 && <p className="text-sm text-ink/45 mb-4">Nobody being served.</p>}
          {serving.map((e) => (
            <TicketRow
              key={e.id}
              position={e.position}
              name={e.customer_name}
              status="serving"
              meta={e.counter_number ? `Counter ${e.counter_number}` : undefined}
              actions={
                <Button size="sm" onClick={() => markEntryAction(queue.id, e.id, 'served')}>
                  Mark served
                </Button>
              }
            />
          ))}
          <Button
            className="mt-4 w-full"
            disabled={waiting.length === 0}
            onClick={() => callNextAction(queue.id)}
          >
            Call next
          </Button>
        </Card>

        <Card>
          <h2 className="font-display text-xl mb-4">Waiting ({waiting.length})</h2>
          {waiting.length === 0 && <p className="text-sm text-ink/45">Nobody waiting yet.</p>}
          {waiting.map((e) => (
            <TicketRow
              key={e.id}
              position={e.position}
              name={e.customer_name}
              status="waiting"
              actions={
                <Button size="sm" variant="secondary" onClick={() => markEntryAction(queue.id, e.id, 'no_show')}>
                  No-show
                </Button>
              }
            />
          ))}
        </Card>
      </div>

      <Card className="h-fit sticky top-6">
        <h2 className="font-display text-xl mb-1">Share this queue</h2>
        <p className="text-xs text-ink/45 break-all mb-4">{joinUrl}</p>
        <div className="bg-white border border-line rounded p-3 flex justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`}
            alt="QR code to join this queue"
            width={200}
            height={200}
          />
        </div>
        <p className="text-xs text-ink/40 text-center mt-3">Print this at your counter</p>
      </Card>
    </div>
  );
}
