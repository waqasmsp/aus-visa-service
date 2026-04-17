-- Seed: billing plan catalog
insert into public.billing_plans (code, name, active, trial_config)
values
  ('starter', 'Starter', true, '{"trial_days": 7}'::jsonb),
  ('growth', 'Growth', true, '{"trial_days": 14}'::jsonb),
  ('enterprise', 'Enterprise', true, '{"trial_days": 30}'::jsonb)
on conflict (code) do update
set name = excluded.name,
    active = excluded.active,
    trial_config = excluded.trial_config,
    updated_at = now();
