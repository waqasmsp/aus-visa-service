-- Ordered baseline migration 008: checkout + payment ledger.

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'draft',
  currency text not null,
  total_amount bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  checkout_order_id uuid references public.checkout_orders(id),
  provider text not null,
  state text not null,
  amount bigint,
  currency text,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_transactions_provider_reference_unique
  on public.payment_transactions (provider, provider_reference)
  where provider_reference is not null;
