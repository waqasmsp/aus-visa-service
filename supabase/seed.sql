-- Base role + starter billing seeds.

insert into public.roles (code, name)
values
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('user', 'User')
on conflict (code) do update
set name = excluded.name;

insert into public.billing_plans (code, name, active, trial_config)
values
  ('starter', 'Starter', true, '{"trial_days": 7}'::jsonb),
  ('pro', 'Pro', true, '{"trial_days": 14}'::jsonb)
on conflict (code) do update
set name = excluded.name,
    active = excluded.active,
    trial_config = excluded.trial_config,
    updated_at = now();

insert into public.billing_plan_intervals (plan_code, interval_code, interval_count, active)
values
  ('starter', 'monthly', 1, true),
  ('starter', 'annual', 1, true),
  ('pro', 'monthly', 1, true),
  ('pro', 'annual', 1, true)
on conflict (plan_code, interval_code) do update
set interval_count = excluded.interval_count,
    active = excluded.active,
    updated_at = now();

with prices as (
  select *
  from (
    values
      ('starter', 'monthly', 'US', 'USD', 2900::bigint, 'exclusive'),
      ('starter', 'annual',  'US', 'USD', 29000::bigint, 'exclusive'),
      ('starter', 'monthly', 'AU', 'AUD', 4400::bigint, 'inclusive'),
      ('starter', 'annual',  'AU', 'AUD', 44000::bigint, 'inclusive'),
      ('pro',     'monthly', 'US', 'USD', 7900::bigint, 'exclusive'),
      ('pro',     'annual',  'US', 'USD', 79000::bigint, 'exclusive'),
      ('pro',     'monthly', 'AU', 'AUD', 11900::bigint, 'inclusive'),
      ('pro',     'annual',  'AU', 'AUD', 119000::bigint, 'inclusive')
  ) as p(plan_code, interval_code, region_code, currency_code, unit_amount, tax_behavior)
),
resolved as (
  select
    bpi.id as billing_plan_interval_id,
    prices.region_code,
    prices.currency_code,
    prices.unit_amount,
    prices.tax_behavior
  from prices
  join public.billing_plan_intervals bpi
    on bpi.plan_code = prices.plan_code
   and bpi.interval_code = prices.interval_code
)
insert into public.billing_plan_prices (
  billing_plan_interval_id,
  region_code,
  currency_code,
  unit_amount,
  tax_behavior,
  active
)
select
  billing_plan_interval_id,
  region_code,
  currency_code,
  unit_amount,
  tax_behavior,
  true
from resolved
on conflict (billing_plan_interval_id, region_code, currency_code) do update
set unit_amount = excluded.unit_amount,
    tax_behavior = excluded.tax_behavior,
    active = excluded.active,
    updated_at = now();
