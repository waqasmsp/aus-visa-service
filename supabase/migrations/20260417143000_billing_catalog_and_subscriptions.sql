-- Billing catalog, subscription lifecycle, and coupon/redemption tracking.

create table if not exists public.billing_plans (
  code text primary key,
  name text not null,
  active boolean not null default true,
  trial_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.billing_plan_intervals (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references public.billing_plans(code) on delete cascade,
  interval_code text not null,
  interval_count integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint billing_plan_intervals_interval_code_check
    check (interval_code in ('monthly', 'annual')),
  constraint billing_plan_intervals_interval_count_check
    check (interval_count > 0),
  constraint billing_plan_intervals_plan_code_interval_code_key
    unique (plan_code, interval_code)
);

create table if not exists public.billing_plan_prices (
  id uuid primary key default gen_random_uuid(),
  billing_plan_interval_id uuid not null references public.billing_plan_intervals(id) on delete cascade,
  region_code text not null,
  currency_code text not null,
  unit_amount bigint not null,
  tax_behavior text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint billing_plan_prices_unit_amount_check
    check (unit_amount >= 0),
  constraint billing_plan_prices_tax_behavior_check
    check (tax_behavior in ('inclusive', 'exclusive', 'unspecified')),
  constraint billing_plan_prices_region_code_check
    check (char_length(region_code) between 2 and 3),
  constraint billing_plan_prices_currency_code_check
    check (char_length(currency_code) = 3),
  constraint billing_plan_prices_interval_region_currency_key
    unique (billing_plan_interval_id, region_code, currency_code)
);

create table if not exists public.billing_plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references public.billing_plans(code) on delete cascade,
  entitlement_key text not null,
  entitlement_limit integer,
  enabled boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint billing_plan_entitlements_limit_check
    check (entitlement_limit is null or entitlement_limit >= 0),
  constraint billing_plan_entitlements_plan_code_key_key
    unique (plan_code, entitlement_key)
);

alter table public.subscriptions
  add column if not exists customer_id uuid,
  add column if not exists profile_id uuid,
  add column if not exists billing_plan_interval_id uuid,
  add column if not exists billing_plan_price_id uuid,
  add column if not exists region_code text,
  add column if not exists currency_code text,
  add column if not exists unit_amount bigint,
  add column if not exists next_billing_date timestamptz,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists cancel_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists grace_period_starts_at timestamptz,
  add column if not exists grace_period_ends_at timestamptz,
  add column if not exists retry_starts_at timestamptz,
  add column if not exists retry_ends_at timestamptz,
  add column if not exists retry_count integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.subscriptions
set customer_id = billing_customer_id
where customer_id is null;

alter table public.subscriptions
  alter column customer_id set not null;

alter table public.subscriptions
  add constraint subscriptions_retry_count_check
  check (retry_count >= 0);

alter table public.subscriptions
  add constraint subscriptions_unit_amount_check
  check (unit_amount is null or unit_amount >= 0);

alter table public.subscriptions
  add constraint subscriptions_currency_code_check
  check (currency_code is null or char_length(currency_code) = 3);

-- FKs added in guarded blocks for idempotency.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_customer_id_fkey') then
    alter table public.subscriptions
      add constraint subscriptions_customer_id_fkey
      foreign key (customer_id) references public.billing_customers(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_profile_id_fkey') then
    alter table public.subscriptions
      add constraint subscriptions_profile_id_fkey
      foreign key (profile_id) references public.profiles(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_billing_plan_interval_id_fkey') then
    alter table public.subscriptions
      add constraint subscriptions_billing_plan_interval_id_fkey
      foreign key (billing_plan_interval_id) references public.billing_plan_intervals(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_billing_plan_price_id_fkey') then
    alter table public.subscriptions
      add constraint subscriptions_billing_plan_price_id_fkey
      foreign key (billing_plan_price_id) references public.billing_plan_prices(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_plan_code_fkey') then
    alter table public.subscriptions
      add constraint subscriptions_plan_code_fkey
      foreign key (plan_code) references public.billing_plans(code);
  end if;
end $$;

create table if not exists public.coupons (
  code text primary key,
  name text not null,
  description text,
  active boolean not null default true,
  discount_type text not null,
  discount_percent numeric(5,2),
  discount_amount bigint,
  currency_code text,
  valid_from timestamptz,
  valid_to timestamptz,
  max_redemptions integer,
  max_redemptions_per_customer integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint coupons_discount_type_check
    check (discount_type in ('percent', 'amount')),
  constraint coupons_discount_percent_check
    check (
      discount_type <> 'percent'
      or (discount_percent is not null and discount_percent > 0 and discount_percent <= 100)
    ),
  constraint coupons_discount_amount_check
    check (
      discount_type <> 'amount'
      or (discount_amount is not null and discount_amount > 0)
    ),
  constraint coupons_currency_code_check
    check (currency_code is null or char_length(currency_code) = 3)
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_code text not null references public.coupons(code),
  customer_id uuid not null references public.billing_customers(id),
  profile_id uuid references public.profiles(id),
  subscription_id uuid references public.subscriptions(id),
  redeemed_at timestamptz not null default now(),
  amount_discounted bigint,
  currency_code text,
  metadata jsonb not null default '{}'::jsonb,
  constraint coupon_redemptions_amount_discounted_check
    check (amount_discounted is null or amount_discounted >= 0),
  constraint coupon_redemptions_currency_code_check
    check (currency_code is null or char_length(currency_code) = 3)
);

create table if not exists public.entitlement_transition_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  customer_id uuid not null references public.billing_customers(id),
  profile_id uuid references public.profiles(id),
  entitlement_key text not null,
  previous_enabled boolean,
  current_enabled boolean,
  previous_limit integer,
  current_limit integer,
  reason text,
  source text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_plan_prices_interval_region_currency_idx
  on public.billing_plan_prices (billing_plan_interval_id, region_code, currency_code)
  where deleted_at is null;

create index if not exists billing_plan_entitlements_plan_key_idx
  on public.billing_plan_entitlements (plan_code, entitlement_key)
  where deleted_at is null;

create index if not exists subscriptions_customer_status_idx
  on public.subscriptions (customer_id, status)
  where deleted_at is null;

create index if not exists subscriptions_next_billing_date_idx
  on public.subscriptions (next_billing_date)
  where deleted_at is null;

create unique index if not exists subscriptions_one_active_per_customer_idx
  on public.subscriptions (customer_id)
  where deleted_at is null and status in ('trialing', 'active', 'past_due', 'grace_period');

create index if not exists coupon_redemptions_customer_id_idx
  on public.coupon_redemptions (customer_id, redeemed_at desc);

create index if not exists coupon_redemptions_coupon_code_idx
  on public.coupon_redemptions (coupon_code, redeemed_at desc);

create index if not exists entitlement_transition_events_subscription_occurred_idx
  on public.entitlement_transition_events (subscription_id, occurred_at desc);

create index if not exists entitlement_transition_events_customer_occurred_idx
  on public.entitlement_transition_events (customer_id, occurred_at desc);

-- updated_at triggers

drop trigger if exists trg_billing_plans_set_updated_at on public.billing_plans;
create trigger trg_billing_plans_set_updated_at
before update on public.billing_plans
for each row
execute function public.set_updated_at();

drop trigger if exists trg_billing_plan_intervals_set_updated_at on public.billing_plan_intervals;
create trigger trg_billing_plan_intervals_set_updated_at
before update on public.billing_plan_intervals
for each row
execute function public.set_updated_at();

drop trigger if exists trg_billing_plan_prices_set_updated_at on public.billing_plan_prices;
create trigger trg_billing_plan_prices_set_updated_at
before update on public.billing_plan_prices
for each row
execute function public.set_updated_at();

drop trigger if exists trg_billing_plan_entitlements_set_updated_at on public.billing_plan_entitlements;
create trigger trg_billing_plan_entitlements_set_updated_at
before update on public.billing_plan_entitlements
for each row
execute function public.set_updated_at();

drop trigger if exists trg_coupons_set_updated_at on public.coupons;
create trigger trg_coupons_set_updated_at
before update on public.coupons
for each row
execute function public.set_updated_at();
