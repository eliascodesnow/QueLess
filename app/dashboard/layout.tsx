import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '../(auth)/actions';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, businesses(name)')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl tracking-tightish">
            Foleni
            {membership?.businesses && (
              <span className="font-sans text-sm text-ink/40 ml-3 tracking-normal">
                {(membership.businesses as any).name}
              </span>
            )}
          </Link>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
