'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createQueueAction } from './queue-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating…' : 'Create queue'}
    </Button>
  );
}

export function CreateQueueForm() {
  const [state, formAction] = useFormState(createQueueAction, { error: undefined as string | undefined });

  return (
    <Card className="h-fit sticky top-6">
      <h2 className="font-display text-xl mb-1">New queue</h2>
      <p className="text-sm text-ink/50 mb-5">One per service, e.g. Haircuts, Consultations.</p>

      <form action={formAction} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input name="name" placeholder="e.g. Haircuts" required />
        </div>
        <div>
          <Label>Description</Label>
          <Input name="description" placeholder="Optional" />
        </div>
        <div>
          <Label>Avg. minutes per customer</Label>
          <Input name="avgServiceTimeMins" type="number" min={1} defaultValue={10} />
        </div>
        <div>
          <Label>Counters serving this queue</Label>
          <Input name="counterCount" type="number" min={1} defaultValue={1} />
        </div>

        {state?.error && <p className="text-sm text-terracotta-dark">{state.error}</p>}

        <SubmitButton />
      </form>
    </Card>
  );
}
