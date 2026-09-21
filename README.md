<<<<<<< HEAD
# Foleni — digital queue management

Skip the physical wait. Businesses (barbershops, clinics, salons, repair
shops, cybercafés, school offices, etc.) create a queue; customers join it
via a link/QR code and see their live position and estimated wait — no
account required.

## Stack
- **Backend**: Node.js, Express, PostgreSQL, Prisma, Socket.io, JWT
- **Frontend**: React (Vite), Socket.io-client
- **Optional SMS**: Africa's Talking (off by default — see below)

## Repo structure
```
foleni/
  backend/     Express API + Socket.io server
  frontend/    React customer + business web app
```

## Local development

### 1. Backend
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init   # creates tables in your Postgres DB
npm run dev                 # starts on http://localhost:4000
```

You need a PostgreSQL database. Easiest local option:
```bash
docker run --name foleni-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=foleni -p 5432:5432 -d postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foleni?schema=public"
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env        # set VITE_API_URL if backend isn't on localhost:4000
npm install
npm run dev                 # starts on http://localhost:5173
```

Open http://localhost:5173, register a business, create a queue, and open
the generated join link in another tab/phone to test the customer flow.

## Deploying (free-tier friendly)

**Backend + database → Railway or Render**
1. Push this repo to GitHub.
2. On Railway: New Project → Deploy from GitHub → select the `backend` folder
   as the service root.
3. Add a PostgreSQL plugin (Railway provisions `DATABASE_URL` automatically —
   copy it into your service's env vars, or reference it directly).
4. Set env vars: `DATABASE_URL`, `JWT_SECRET` (long random string),
   `CLIENT_URL` (your deployed frontend URL, set after step below),
   `NODE_ENV=production`.
5. Set the start command to `npm run prisma:migrate && npm start` so
   migrations run on every deploy.
   --> NO RAILWAY / RENDER ANYMORE

**Frontend → Vercel**
1. New Project → import the repo → set root directory to `frontend`.
2. Build command `npm run build`, output directory `dist`.
3. Env var: `VITE_API_URL` = your Railway backend URL.
4. Once deployed, copy the Vercel URL back into the backend's `CLIENT_URL`
   env var and redeploy the backend (needed for CORS + QR/join links to be
   correct).

## SMS notifications (optional, off by default)
SMS is **disabled globally** by default so nobody incurs charges accidentally.
To enable:
1. Create a free account at https://africastalking.com — sandbox mode gives
   free test credits; production sending costs a small per-SMS fee.
2. Set `SMS_ENABLED_GLOBALLY=true`, `AFRICASTALKING_USERNAME`,
   `AFRICASTALKING_API_KEY` in the backend env.
3. Run `npm install africastalking` in `backend/` (not included by default
   to keep the base install light).
4. Each business also needs `smsEnabled=true` on their own account — this
   isn't exposed in the UI yet; flip it via `npx prisma studio` or a quick
   API call until you build a settings page.

Without any of this configured, real-time in-app updates (Socket.io) still
work fully for free — SMS is purely an enhancement.

## What's intentionally NOT in the MVP
- Customer accounts / login (kept anonymous by design — lower friction)
- Multi-staff role management per business (single business login for now)
- Analytics/reporting dashboard
- Payment processing

## A small philosophy note
The community board (visible on the customer status page) exists so a queue
app doesn't just turn waiting into staring at a phone — it's opt-in per
queue, scoped to people in that same line, and meant to nudge toward real
conversation, not replace it.
=======
# Foleni

Queue management built for the counter, not the boardroom. A business
creates a queue, shares a link or QR code, and customers join from their
phone, no app, no account. They see their number and estimated wait; the
business calls the next one with a tap.

"Foleni" is the Swahili word for queue. The design leans into that: a warm
paper background instead of the usual dark-mode SaaS look, a serif with
real character (Fraunces) for headlines, and a recurring torn-ticket-stub
motif for queue positions, because that is literally what this replaces.

## Stack
- **Framework**: Next.js 14 (App Router, Server Actions)
- **Database + Auth + Realtime**: Supabase (Postgres, Row Level Security, `postgres_changes` subscriptions)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS with a custom design system (no default theme)

## What's included beyond a bare MVP
Built into the schema so they are not painful retrofits later:
- **Business branding** — logo and accent color per business (`businesses.logo_url`, `businesses.accent_color`), so a public queue page can carry the business's own look.
- **Staff accounts with roles** — `business_members` lets a business add employees with their own login (`owner` / `manager` / `staff`), instead of one shared account.
- **Multi-counter calling** — `queue_entries.counter_number`, so a business with more than one station serving the same queue can say "Counter 2," not just "you're next."
- **Appointments / pre-booking** — `appointments` holds a future time slot that converts into a live queue entry on the day (the conversion job itself is not wired up yet — see below).
- **Daily analytics rollup** — `daily_stats`, updated by a Postgres trigger whenever an entry is marked served or a no-show, so the dashboard's "served today / average wait / no-shows" cards are a single indexed read, not a live aggregation.
- **Community board** — opt-in, per-queue chat so people waiting together can actually find each other, not just stare at a countdown.

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. In the SQL Editor, paste the contents of `supabase/schema.sql` and run it. This creates every table, the daily-stats trigger, and all Row Level Security policies.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public key**. These become `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. In **Authentication → Providers**, email/password is on by default, which is all this app uses. If you want to skip email confirmation for faster local testing, turn off "Confirm email" under **Authentication → Settings**.
5. In **Database → Replication**, confirm the `queue_entries` and `chat_messages` tables have Realtime enabled (Supabase enables this by default for new tables, but it's worth checking).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev                  # http://localhost:3000
```

Register a business, create a queue, then open the generated `/join/<code>`
link in another tab or on your phone to try the customer flow. Realtime
updates should appear on both sides without a refresh.

## Deploying on Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com/new), import the repo. Vercel detects Next.js automatically, no build settings to change.
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — set this to your Vercel deployment URL (e.g. `https://foleni.vercel.app`) once you know it; it's used to build the join links and QR codes shown on the dashboard.
4. Deploy. Then go back and update `NEXT_PUBLIC_SITE_URL` if the assigned domain differs from what you guessed, and redeploy.

No separate backend to host and no CORS configuration anywhere: the app
talks to Supabase directly from both the server (Server Components, Server
Actions) and the browser (Realtime subscriptions), using Supabase's own
Row Level Security to keep that safe.

## Regenerating real database types

`database.types.ts` is hand-written as a starting point. Once your schema
is live on Supabase, replace it with the real generated types:

```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-ref> > database.types.ts
```

After that, you can re-tighten `lib/supabase/client.ts` and
`lib/supabase/server.ts` by passing `<Database>` back into
`createBrowserClient` / `createServerClient` for full type-checked queries.

## Known gaps, called out on purpose
- **Appointment conversion isn't wired up.** The `appointments` table exists and a customer can be inserted into it, but nothing yet promotes an appointment into a live `queue_entries` row when its time arrives. That's a Supabase Edge Function (scheduled via `pg_cron` or Supabase's Cron feature) checking for due appointments every few minutes.
- **SMS notifications aren't included in this pass.** The earlier version of this project wired up Africa's Talking behind an opt-in flag; that logic did not carry over into this rebuild and would need to be re-added, most naturally as a Supabase Edge Function triggered by the `served_at`/`called_at` update on `queue_entries`.
- **Staff invitation flow isn't built.** `business_members` supports more than one user per business at the schema and RLS level, but there is no UI yet for an owner to invite a staff member, only the owner row created at registration.
- **No settings page** for editing a business's branding (logo, accent color) or a queue's chat toggle after creation, both columns exist and are used by RLS and the public pages, just not yet exposed in the dashboard.

None of these block a working deploy. They are the next layer once the
core flow (create a queue, join it, call the next customer, see it live)
is confirmed working end to end.
"# QueLess" 
>>>>>>> 8d7e8ca62ac573fc93ce22ea254f2f6da861efbb
