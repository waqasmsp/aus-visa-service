-- Bounded context: settings

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, key)
);

drop trigger if exists trg_user_settings_set_updated_at on public.user_settings;
create trigger trg_user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();
