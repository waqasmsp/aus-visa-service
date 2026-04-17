-- Seed: default app settings
insert into public.app_settings (key, scope, value)
values
  ('support_email', 'global', jsonb_build_object('value', 'support@example.com')),
  ('default_locale', 'global', jsonb_build_object('value', 'en-AU')),
  ('maintenance_mode', 'global', jsonb_build_object('enabled', false))
on conflict (key, scope) do update
set value = excluded.value,
    updated_at = now();
