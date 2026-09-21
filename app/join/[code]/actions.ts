'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function joinQueueAction(
  joinCode: string,
  _prevState: { error?: string },
  formData: FormData
) {
  const supabase = createClient();

  const customerName = String(formData.get('customerName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;

  if (!customerName) return { error: 'Enter your name to join.' };

  const { data: queue } = await supabase.from('queues').select('*').eq('join_code', joinCode).single();
  if (!queue) return { error: 'This queue could not be found.' };
  if (queue.status !== 'open') return { error: "This queue isn't accepting new customers right now." };

  const { data: lastEntry } = await supabase
    .from('queue_entries')
    .select('position')
    .eq('queue_id', queue.id)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (lastEntry?.position ?? 0) + 1;

  const { data: entry, error } = await supabase
    .from('queue_entries')
    .insert({
      queue_id: queue.id,
      customer_name: customerName,
      phone,
      position: nextPosition,
    })
    .select()
    .single();

  if (error || !entry) return { error: 'Could not join the queue. Try again.' };

  redirect(`/status/${joinCode}/${entry.session_token}`);
}
