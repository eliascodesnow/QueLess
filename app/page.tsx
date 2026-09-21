import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <main className="relative">
      <header className="flex items-center justify-between px-6 py-6 md:px-12 md:py-8 max-w-6xl mx-auto">
        <span className="font-display text-2xl tracking-tightish">Foleni</span>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Start a queue</Button>
          </Link>
        </nav>
      </header>

      <section className="px-6 md:px-12 max-w-6xl mx-auto pt-10 pb-20 md:pt-16 md:pb-28">
        <p className="text-terracotta text-sm font-semibold uppercase tracking-widetrack mb-5">
          For the counter, not the boardroom
        </p>
        <h1 className="font-display text-[2.6rem] leading-[1.05] md:text-7xl md:leading-[0.98] tracking-tightish max-w-3xl">
          Join the line without standing in it.
        </h1>
        <p className="mt-7 text-lg md:text-xl text-ink/60 max-w-xl leading-relaxed">
          Foleni turns any counter, barbershop chair, or clinic desk into a
          queue people can join from their phone. They see their number,
          their wait, and when to actually walk in.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 max-w-xs sm:max-w-none">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">Create your first queue</Button>
          </Link>
          <Link href="#how">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">See how it works</Button>
          </Link>
        </div>
      </section>

      <section id="how" className="px-6 md:px-12 max-w-6xl mx-auto py-16 border-t border-line">
        <div className="grid md:grid-cols-3 gap-10">
          <Step
            n="01"
            title="You put up a code"
            body="Print the QR code at your counter, or paste the join link anywhere you already talk to customers, WhatsApp status, an Instagram bio, a printed sign."
          />
          <Step
            n="02"
            title="They join from where they are"
            body="No app to download, no account to make. A name, a number if they want SMS, and they have a ticket with a real position in line."
          />
          <Step
            n="03"
            title="You call the next one"
            body="One tap moves the line forward. If you run more than one counter, you say exactly which one. Everyone waiting sees it update live."
          />
        </div>
      </section>

      <section className="px-6 md:px-12 max-w-6xl mx-auto py-16 border-t border-line">
        <div className="bg-ink text-paper rounded-lg px-8 py-12 md:px-14 md:py-16">
          <p className="text-terracotta-light text-sm font-semibold uppercase tracking-widetrack mb-4">
            Built to be believed by a business, not just a developer
          </p>
          <h2 className="font-display text-3xl md:text-4xl max-w-xl leading-tight">
            Staff logins, multiple counters, and daily numbers your owner
            actually checks.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-10 text-paper/70 text-sm">
            <div>
              <p className="text-paper font-medium mb-1">Staff, not just an owner</p>
              Add employees with their own login so more than one person can
              run the counter.
            </div>
            <div>
              <p className="text-paper font-medium mb-1">Multiple counters</p>
              Call a customer to "Counter 2" the moment you have more than
              one person serving.
            </div>
            <div>
              <p className="text-paper font-medium mb-1">A number worth checking</p>
              Served today, average wait, no-shows, without exporting
              anything.
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 max-w-6xl mx-auto py-10 text-sm text-ink/40 flex items-center justify-between">
        <span>Foleni</span>
        <span>Nairobi</span>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <span className="font-display text-terracotta text-2xl">{n}</span>
      <h3 className="font-medium text-lg mt-2 mb-2">{title}</h3>
      <p className="text-ink/55 text-[0.95rem] leading-relaxed">{body}</p>
    </div>
  );
}
