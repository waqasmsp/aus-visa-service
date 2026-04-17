-- Bounded context: billing

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  provider text not null,
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (provider, provider_customer_id)
);

drop trigger if exists trg_billing_customers_set_updated_at on public.billing_customers;
create trigger trg_billing_customers_set_updated_at
before update on public.billing_customers
for each row
execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id),
  plan_code text not null,
  status text not null,
  period_started_at timestamptz,
  period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_subscriptions_set_updated_at on public.subscriptions;
create trigger trg_subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();
