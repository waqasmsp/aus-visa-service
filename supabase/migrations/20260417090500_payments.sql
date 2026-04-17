-- Bounded context: payments

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  amount_cents bigint not null,
  currency text not null,
  provider text not null,
  provider_payment_id text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_payments_set_updated_at on public.payments;
create trigger trg_payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_payment_events_set_updated_at on public.payment_events;
create trigger trg_payment_events_set_updated_at
before update on public.payment_events
for each row
execute function public.set_updated_at();
