'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function normalizeQueueCode(rawValue: string) {
  const cleaned = rawValue.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return cleaned;
}

export default function JoinLandingPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    scanningRef.current = false;
    setIsScanning(false);
    setCameraEnabled(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const navigateToQueue = (rawValue: string) => {
    const normalized = normalizeQueueCode(rawValue);
    if (!normalized) {
      setCameraBlocked(true);
      return;
    }

    stopCamera();
    router.push(`/join/${normalized}`);
  };

  const startCameraScan = async () => {
    if (!('BarcodeDetector' in window)) {
      setCameraBlocked(true);
      return;
    }

    try {
      setCameraBlocked(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      scanningRef.current = true;
      setCameraEnabled(true);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

      const scanFrame = async () => {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const barcodeValue = barcodes[0]?.rawValue;
            if (barcodeValue) {
              navigateToQueue(barcodeValue);
              return;
            }
          }
        } catch {
          // Ignore quick detection errors while the camera is warming up.
        }

        frameRef.current = requestAnimationFrame(scanFrame);
      };

      scanFrame();
    } catch {
      stopCamera();
      setCameraBlocked(true);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToQueue(joinCode);
  };

  return (
    <main className="min-h-screen bg-paper px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between gap-3">
          <Link href="/" className="font-display text-2xl tracking-tightish text-ink">
            Foleni
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Business login
            </Button>
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
              Join a queue
            </p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Skip the line. Join from your phone.
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink/65">
              Enter the queue code from the business or scan the QR code at the counter. No app,
              no account, and no standing around waiting.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label htmlFor="queue-code" className="mb-2 block text-sm font-medium text-ink/70">
                  Queue code
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="queue-code"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    placeholder="e.g. BR9K2"
                    className="uppercase"
                    aria-label="Queue code"
                  />
                  <Button type="submit" className="sm:w-auto">
                    Find queue
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={startCameraScan}>
                {isScanning ? 'Scanning…' : 'Scan QR code'}
              </Button>
              <Button type="button" variant="ghost" onClick={stopCamera}>
                Clear camera
              </Button>
            </div>

            {cameraBlocked && (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Your camera is unavailable here. Type the queue code manually to continue.
              </p>
            )}

            {cameraEnabled && (
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-ink/5 p-3">
                <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">How it works</p>
              <div className="mt-5 space-y-4">
                <Step n="01" title="Get the code" body="Ask the business for the queue code or scan the QR poster at the desk." />
                <Step n="02" title="Join from your phone" body="Enter your name and your ticket is created instantly without downloading any app." />
                <Step n="03" title="Wait without standing" body="Watch your live position and receive updates when it is your turn." />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-ink p-5 text-paper shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-paper/65">Why customers like it</p>
              <ul className="mt-4 space-y-3 text-sm text-paper/80">
                <li>• Quick join from a phone, even on the go.</li>
                <li>• Live queue updates without constant checking.</li>
                <li>• Simple for businesses to print, share, or post online.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-sm font-semibold text-terracotta">
        {n}
      </div>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">{body}</p>
      </div>
    </div>
  );
}
