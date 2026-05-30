-- Kolejka odłożonych SMS-ów (wysyłane poza dozwolonymi godzinami)
-- Uruchom w panelu Supabase: Database > SQL Editor

create table if not exists public.sms_queue (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null,
  message      text not null,
  scheduled_for timestamptz not null,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists sms_queue_pending_idx
  on public.sms_queue (scheduled_for)
  where sent_at is null;

alter table public.sms_queue enable row level security;

create policy "service_role_all" on public.sms_queue
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
