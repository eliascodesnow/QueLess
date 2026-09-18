'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { joinQueueAction } from './actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Joining…' : 'Join this queue'}
    </Button>
  );
}

export function JoinForm({ joinCode }: { joinCode: string }) {
  const action = joinQueueAction.bind(null, joinCode);
  const [state, formAction] = useFormState(action, { error: undefined as string | undefined });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label>Your name</Label>
        <Input name="customerName" required />
      </div>
      <div>
        <Label>Phone (optional)</Label>
        <Input name="phone" placeholder="+254…" />
      </div>
      {state?.error && <p className="text-sm text-terracotta-dark">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
