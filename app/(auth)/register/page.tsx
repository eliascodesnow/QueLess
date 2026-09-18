'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { registerAction } from '../actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Creating your account…' : 'Create account'}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, { error: undefined as string | undefined });

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl tracking-tightish block mb-10">
          Foleni
        </Link>
        <h1 className="font-display text-3xl mb-2">Set up your business</h1>
        <p className="text-ink/55 mb-8 text-[0.95rem]">
          A barbershop, a clinic, a repair shop, whatever it is, this is
          where your queues will live.
        </p>

        <form action={formAction} className="space-y-5">
          <div>
            <Label>Business name</Label>
            <Input name="name" placeholder="e.g. Kahawa Barbers" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" minLength={8} required />
            <p className="text-xs text-ink/40 mt-1.5">At least 8 characters.</p>
          </div>

          {state?.error && <p className="text-sm text-terracotta-dark">{state.error}</p>}

          <SubmitButton />
        </form>

        <p className="mt-8 text-sm text-ink/50 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
