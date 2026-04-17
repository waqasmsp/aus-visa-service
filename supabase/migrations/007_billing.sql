-- Ordered baseline migration 007: billing catalog + subscriptions.

create table if not exists public.billing_plans (
  code text primary key,
  name text not null,
  active boolean not null default true,
  trial_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_plan_intervals (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references public.billing_plans(code) on delete cascade,
  interval_code text not null,
  interval_count integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_code, interval_code)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  billing_plan_interval_id uuid references public.billing_plan_intervals(id) on delete set null,
  status text not null,
  started_at timestamptz,
  next_billing_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
