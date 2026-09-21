'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { loginAction } from '../actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Logging in…' : 'Log in'}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, { error: undefined as string | undefined });

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl tracking-tightish block mb-10">
          Foleni
        </Link>
        <h1 className="font-display text-3xl mb-2">Welcome back</h1>
        <p className="text-ink/55 mb-8 text-[0.95rem]">Log in to run your queues.</p>

        <form action={formAction} className="space-y-5">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" required />
          </div>

          {state?.error && <p className="text-sm text-terracotta-dark">{state.error}</p>}

          <SubmitButton />
        </form>

        <p className="mt-8 text-sm text-ink/50 text-center">
          No account yet?{' '}
          <Link href="/register" className="text-ink underline underline-offset-4">
            Set up your business
          </Link>
        </p>
      </div>
    </main>
  );
}
