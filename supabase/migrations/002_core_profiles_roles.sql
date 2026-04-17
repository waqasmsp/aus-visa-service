-- Ordered baseline migration 002: core profile, role, and activity tables.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  full_name text,
  phone text,
  country text,
  status text not null default 'active',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key
  on public.profiles (email)
  where email is not null;

create index if not exists profiles_country_idx
  on public.profiles (country);

create table if not exists public.roles (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create index if not exists profile_roles_role_id_profile_id_idx
  on public.profile_roles (role_id, profile_id);

create index if not exists profile_roles_profile_id_assigned_at_idx
  on public.profile_roles (profile_id, assigned_at desc);

create table if not exists public.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_scope text,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_activity_events_profile_occurred_idx
  on public.user_activity_events (profile_id, occurred_at desc);

create index if not exists user_activity_events_type_occurred_idx
  on public.user_activity_events (event_type, occurred_at desc);

insert into public.roles (code, name)
values
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('user', 'User')
on conflict (code) do update
set name = excluded.name;

-- updated_at trigger

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
