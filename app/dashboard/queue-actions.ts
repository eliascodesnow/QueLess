'use server';

import { createClient } from '@/lib/supabase/server';
import { generateJoinCode } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getBusinessId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();
  if (!data) throw new Error('No business found for this account');
  return data.business_id;
}

export async function createQueueAction(_prevState: { error?: string }, formData: FormData) {
  const supabase = createClient();
  const businessId = await getBusinessId();

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const avgServiceTimeMins = Number(formData.get('avgServiceTimeMins') ?? 10);
  const counterCount = Number(formData.get('counterCount') ?? 1);

  if (!name) return { error: 'Give the queue a name.' };

  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase.from('queues').select('id').eq('join_code', joinCode);
    if (!clash || clash.length === 0) break;
    joinCode = generateJoinCode();
  }

  const { error } = await supabase.from('queues').insert({
    business_id: businessId,
    name,
    description,
    avg_service_time_mins: avgServiceTimeMins,
    counter_count: counterCount,
    join_code: joinCode,
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function updateQueueStatusAction(queueId: string, status: 'open' | 'paused' | 'closed') {
  const supabase = createClient();
  await supabase.from('queues').update({ status }).eq('id', queueId);
  revalidatePath(`/dashboard/queues/${queueId}`);
}

export async function callNextAction(queueId: string, counterNumber?: number) {
  const supabase = createClient();

  const { data: currentlyServing } = await supabase
    .from('queue_entries')
    .select('id')
    .eq('queue_id', queueId)
    .eq('status', 'serving');

  if (currentlyServing && currentlyServing.length > 0) {
    await supabase
      .from('queue_entries')
      .update({ status: 'served', served_at: new Date().toISOString() })
      .in('id', currentlyServing.map((e) => e.id));
  }

  const { data: next } = await supabase
    .from('queue_entries')
    .select('id')
    .eq('queue_id', queueId)
    .eq('status', 'waiting')
    .order('position', { ascending: true })
    .limit(1)
    .single();

  if (next) {
    await supabase
      .from('queue_entries')
      .update({
        status: 'serving',
        called_at: new Date().toISOString(),
        counter_number: counterNumber ?? 1,
      })
      .eq('id', next.id);
  }

  revalidatePath(`/dashboard/queues/${queueId}`);
}

export async function markEntryAction(
  queueId: string,
  entryId: string,
  status: 'served' | 'no_show' | 'left'
) {
  const supabase = createClient();
  await supabase
    .from('queue_entries')
    .update({
      status,
      served_at: status === 'served' ? new Date().toISOString() : undefined,
    })
    .eq('id', entryId);

  revalidatePath(`/dashboard/queues/${queueId}`);
}
