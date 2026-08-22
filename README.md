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
