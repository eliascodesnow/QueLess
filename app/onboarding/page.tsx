import Link from 'next/link';
import { redirect } from 'next/navigation';

import { completeOnboardingAction } from '../(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership) redirect('/dashboard');

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl tracking-tightish block mb-10">
          Foleni
        </Link>
        <h1 className="font-display text-3xl mb-2">Set up your business</h1>
        <p className="text-ink/55 mb-8 text-[0.95rem]">
          Add the name your customers will recognize.
        </p>

        <form action={completeOnboardingAction} className="space-y-5">
          <div>
            <Label>Business name</Label>
            <Input name="name" placeholder="e.g. Clinic or Barbershop" required />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Set up your business
          </Button>
        </form>
      </div>
    </main>
  );
}
