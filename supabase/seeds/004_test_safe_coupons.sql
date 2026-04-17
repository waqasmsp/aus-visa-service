-- Seed: test-safe coupons for non-production validation
insert into public.billing_coupons (
  code,
  name,
  discount_type,
  discount_value,
  currency_code,
  duration,
  duration_months,
  active,
  metadata
)
values
  (
    'TEST10',
    'Test 10% Off',
    'percent',
    10,
    'AUD',
    'once',
    null,
    true,
    '{"safe_for":"test","max_redemptions":50}'::jsonb
  ),
  (
    'TEST500',
    'Test $5.00 Off',
    'amount',
    500,
    'AUD',
    'once',
    null,
    true,
    '{"safe_for":"test","max_redemptions":50}'::jsonb
  )
on conflict (code) do update
set name = excluded.name,
    discount_type = excluded.discount_type,
    discount_value = excluded.discount_value,
    currency_code = excluded.currency_code,
    duration = excluded.duration,
    duration_months = excluded.duration_months,
    active = excluded.active,
    metadata = excluded.metadata,
    updated_at = now();
