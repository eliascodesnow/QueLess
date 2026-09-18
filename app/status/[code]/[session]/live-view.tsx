'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TicketLarge } from '@/components/ticket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Database } from '@/database.types';

type Entry = Database['public']['Tables']['queue_entries']['Row'];
type Queue = Database['public']['Tables']['queues']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

export function StatusLiveView({
  entry: initialEntry,
  queue,
  initialPeopleAhead,
  initialChat,
}: {
  entry: Entry;
  queue: Queue;
  initialPeopleAhead: number;
  initialChat: ChatMessage[];
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [peopleAhead, setPeopleAhead] = useState(initialPeopleAhead);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [chatName, setChatName] = useState('');
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const entryChannel = supabase
      .channel(`entry-${entry.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries', filter: `queue_id=eq.${queue.id}` },
        async () => {
          const { data: fresh } = await supabase
            .from('queue_entries')
            .select('*')
            .eq('id', entry.id)
            .single();
          if (fresh) setEntry(fresh);

          if (fresh?.status === 'waiting') {
            const { count } = await supabase
              .from('queue_entries')
              .select('id', { count: 'exact', head: true })
              .eq('queue_id', queue.id)
              .eq('status', 'waiting')
              .lt('position', fresh.position);
            setPeopleAhead(count ?? 0);
          }
        }
      )
      .subscribe();

    const chatChannel = queue.chat_enabled
      ? supabase
          .channel(`chat-${queue.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `queue_id=eq.${queue.id}` },
            (payload) => {
              setMessages((m) => [...m, payload.new as ChatMessage]);
            }
          )
          .subscribe()
      : null;

    return () => {
      supabase.removeChannel(entryChannel);
      if (chatChannel) supabase.removeChannel(chatChannel);
    };
  }, [entry.id, queue.id, queue.chat_enabled]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleLeave() {
    const supabase = createClient();
    await supabase.from('queue_entries').update({ status: 'left' }).eq('id', entry.id);
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatText.trim()) return;
    const supabase = createClient();
    await supabase.from('chat_messages').insert({
      queue_id: queue.id,
      display_name: chatName.trim() || 'Someone in line',
      message: chatText.trim().slice(0, 300),
    });
    setChatText('');
  }

  const estimatedWait = peopleAhead * queue.avg_service_time_mins;

  return (
    <main className="min-h-screen px-6 py-14">
      <div className="max-w-sm mx-auto">
        <p className="font-display text-2xl tracking-tightish mb-8">Foleni</p>

        {entry.status === 'waiting' && (
          <>
            <TicketLarge
              position={entry.position}
              label={queue.name}
              sublabel={`${peopleAhead} ahead · ~${estimatedWait} min estimated`}
            />
            <Button variant="secondary" className="w-full mt-5" onClick={handleLeave}>
              Leave this queue
            </Button>
          </>
        )}

        {entry.status === 'serving' && (
          <div className="ticket-edge bg-teal text-paper rounded-md shadow-ticket px-8 py-12 text-center">
            <p className="text-xs uppercase tracking-widetrack text-paper/70 mb-3">
              {queue.name}
            </p>
            <p className="font-display text-4xl mb-2">You&apos;re up</p>
            {entry.counter_number && (
              <p className="text-paper/80">Head to counter {entry.counter_number}</p>
            )}
          </div>
        )}

        {entry.status === 'served' && (
          <p className="text-center text-ink/60 py-10">You&apos;ve been served. Thanks for using Foleni.</p>
        )}

        {entry.status === 'no_show' && (
          <p className="text-center text-terracotta-dark py-10">You were marked as a no-show.</p>
        )}

        {entry.status === 'left' && (
          <p className="text-center text-ink/50 py-10">You left this queue.</p>
        )}

        {queue.chat_enabled && (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="font-display text-lg mb-1">Community board</h2>
            <p className="text-xs text-ink/45 mb-4">
              For people waiting in this same line. Say hi, or find each other in person.
            </p>

            <div className="max-h-52 overflow-y-auto space-y-2 mb-4">
              {messages.length === 0 && <p className="text-xs text-ink/35">No messages yet.</p>}
              {messages.map((m) => (
                <div key={m.id} className="bg-paper-dim rounded px-3 py-2">
                  <p className="text-xs font-semibold text-terracotta-dark">{m.display_name}</p>
                  <p className="text-sm text-ink/80">{m.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChat} className="space-y-2">
              <Input
                placeholder="Your name (optional)"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Say something…"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                />
                <Button type="submit" size="sm">
                  Post
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
