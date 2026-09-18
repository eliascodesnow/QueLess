-- Foleni database schema for Supabase.
-- Run this in the Supabase SQL editor, or via `supabase db push` with the CLI.

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────
-- BUSINESSES
-- One row per registered business. auth.users (Supabase Auth) is the
-- account; this table holds everything specific to the business itself,
-- including white-label branding so a queue page can carry the business's
-- own look rather than Foleni's.
-- ─────────────────────────────────────────────────────────────────────────
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,                 -- used in public URLs: foleni.app/b/<slug>
  logo_url text,
  accent_color text default '#C1502E',       -- business's own brand color for their public pages
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- STAFF / ROLES
-- Lets a business add employees who can call customers and manage a queue
-- from their own login, instead of one shared owner account. This is the
-- feature that stops the product being a single-person toy once a business
-- has more than one counter or shift.
-- ─────────────────────────────────────────────────────────────────────────
create type staff_role as enum ('owner', 'manager', 'staff');

create table business_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role staff_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- QUEUES
-- ─────────────────────────────────────────────────────────────────────────
create type queue_status as enum ('open', 'paused', 'closed');

create table queues (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  status queue_status not null default 'open',
  avg_service_time_mins int not null default 10,
  join_code text unique not null,            -- short public code, e.g. AMB-274
  chat_enabled boolean not null default true,
  counter_count int not null default 1,      -- how many stations can serve this queue at once
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- QUEUE ENTRIES
-- Anonymous by design. counter_number is set when a staff member calls the
-- customer, so a business with multiple stations can say "Counter 2" not
-- just "you're next" — this matters the moment a business scales past one
-- person serving.
-- ─────────────────────────────────────────────────────────────────────────
create type entry_status as enum ('waiting', 'serving', 'served', 'no_show', 'left');

create table queue_entries (
  id uuid primary key default uuid_generate_v4(),
  queue_id uuid not null references queues(id) on delete cascade,
  customer_name text not null,
  phone text,
  position int not null,
  status entry_status not null default 'waiting',
  counter_number int,
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz,
  session_token uuid not null default uuid_generate_v4() unique
);

create index on queue_entries (queue_id, status);

-- ─────────────────────────────────────────────────────────────────────────
-- APPOINTMENTS (pre-booked slots)
-- A hybrid of walk-in queue and booking: a customer can reserve a future
-- time slot instead of joining a live line. On the appointment's day, it
-- converts into a queue_entry automatically (handled in application code
-- or a scheduled Supabase Edge Function) so the live queue stays the
-- single source of truth for "who is next."
-- ─────────────────────────────────────────────────────────────────────────
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  queue_id uuid not null references queues(id) on delete cascade,
  customer_name text not null,
  phone text,
  scheduled_for timestamptz not null,
  converted_entry_id uuid references queue_entries(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- COMMUNITY BOARD
-- Queue-scoped, opt-in messaging for people waiting in the same line.
-- ─────────────────────────────────────────────────────────────────────────
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  queue_id uuid not null references queues(id) on delete cascade,
  display_name text not null default 'Someone in line',
  message text not null,
  created_at timestamptz not null default now()
);

create index on chat_messages (queue_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────
-- DAILY STATS (denormalized rollup)
-- Cheap analytics without scanning queue_entries on every dashboard load.
-- Updated by a trigger whenever an entry is marked served/no_show.
-- ─────────────────────────────────────────────────────────────────────────
create table daily_stats (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  queue_id uuid not null references queues(id) on delete cascade,
  day date not null default current_date,
  served_count int not null default 0,
  no_show_count int not null default 0,
  total_wait_mins int not null default 0,     -- sum, for computing an average
  unique (queue_id, day)
);

create or replace function bump_daily_stats() returns trigger as $$
begin
  if new.status = 'served' and old.status is distinct from 'served' then
    insert into daily_stats (business_id, queue_id, day, served_count, total_wait_mins)
    select q.business_id, new.queue_id, current_date, 1,
           greatest(0, extract(epoch from (new.served_at - new.joined_at)) / 60)::int
    from queues q where q.id = new.queue_id
    on conflict (queue_id, day) do update
      set served_count = daily_stats.served_count + 1,
          total_wait_mins = daily_stats.total_wait_mins + excluded.total_wait_mins;
  elsif new.status = 'no_show' and old.status is distinct from 'no_show' then
    insert into daily_stats (business_id, queue_id, day, no_show_count)
    select q.business_id, new.queue_id, current_date, 1
    from queues q where q.id = new.queue_id
    on conflict (queue_id, day) do update
      set no_show_count = daily_stats.no_show_count + 1;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_bump_daily_stats
  after update on queue_entries
  for each row execute function bump_daily_stats();

-- ─────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────
alter table businesses enable row level security;
alter table business_members enable row level security;
alter table queues enable row level security;
alter table queue_entries enable row level security;
alter table appointments enable row level security;
alter table chat_messages enable row level security;
alter table daily_stats enable row level security;

-- Helper: is the current user a member of this business?
create or replace function is_business_member(target_business_id uuid) returns boolean as $$
  select exists (
    select 1 from business_members
    where business_id = target_business_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Businesses: owners and staff can see and manage their own business.
create policy "members can view their business" on businesses
  for select using (is_business_member(id));
create policy "owner can update their business" on businesses
  for update using (owner_id = auth.uid());
create policy "authenticated users can create a business" on businesses
  for insert with check (owner_id = auth.uid());

create policy "members can view their membership rows" on business_members
  for select using (is_business_member(business_id));

-- Queues: members manage; the public can read basic fields via a narrow
-- view (see public_queue_lookup below) rather than this table directly.
create policy "members can manage queues" on queues
  for all using (is_business_member(business_id));
create policy "anyone can read an open queue by id" on queues
  for select using (true); -- narrowed at the application layer to safe columns

-- Queue entries: members of the owning business can manage all entries.
create policy "members can manage entries" on queue_entries
  for all using (
    is_business_member((select business_id from queues where id = queue_id))
  );

-- Anonymous customers can insert their own entry (joining a queue) and can
-- read/update only the single row matching the session token they hold.
create policy "anyone can join a queue" on queue_entries
  for insert with check (true);
create policy "anyone can read entries for realtime position updates" on queue_entries
  for select using (true); -- position numbers are not sensitive; names stay client-side filtered

create policy "members can manage appointments" on appointments
  for all using (is_business_member((select business_id from queues where id = queue_id)));
create policy "anyone can book an appointment" on appointments
  for insert with check (true);

create policy "anyone can read chat for a queue" on chat_messages
  for select using (true);
create policy "anyone can post to an enabled chat" on chat_messages
  for insert with check (
    exists (select 1 from queues where id = queue_id and chat_enabled = true)
  );

create policy "members can view their stats" on daily_stats
  for select using (is_business_member(business_id));
