import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { StatusLiveView } from './live-view';

export default async function StatusPage({
  params,
}: {
  params: { code: string; session: string };
}) {
  const supabase = createClient();

  const { data: entry } = await supabase
    .from('queue_entries')
    .select('*, queues(*)')
    .eq('session_token', params.session)
    .single();

  if (!entry) notFound();

  const queue = entry.queues as any;

  const { count: peopleAhead } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('queue_id', queue.id)
    .eq('status', 'waiting')
    .lt('position', entry.position);

  const { data: chatHistory } = queue.chat_enabled
    ? await supabase
        .from('chat_messages')
        .select('*')
        .eq('queue_id', queue.id)
        .order('created_at', { ascending: true })
        .limit(50)
    : { data: [] };

  return (
    <StatusLiveView
      entry={entry}
      queue={queue}
      initialPeopleAhead={peopleAhead ?? 0}
      initialChat={chatHistory ?? []}
    />
  );
}
