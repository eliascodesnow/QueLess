'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '416075406352-v72j21lefuf2mo9iqvtluhc3658il685.apps.googleusercontent.com';

export function GoogleAuthButton({ label = 'Continue with Gmail' }: { label?: string }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptLoaded || typeof window === 'undefined') {
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }: { credential?: string }) => {
        if (!credential) {
          setError('Google sign-in failed. Please try again.');
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        });

        if (error) {
          setError(error.message);
          return;
        }

        router.push('/dashboard');
        router.refresh();
      },
    });

    setIsReady(true);
  }, [router, scriptLoaded]);

  const handleGoogleSignIn = () => {
    const google = (window as any).google;

    if (!google?.accounts?.id) {
      setError('Google sign-in is still loading. Please wait a moment and try again.');
      return;
    }

    google.accounts.id.prompt();
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={!isReady}
        >
          {label}
        </Button>

        {error && <p className="text-sm text-terracotta-dark">{error}</p>}
      </div>
    </>
  );
}
