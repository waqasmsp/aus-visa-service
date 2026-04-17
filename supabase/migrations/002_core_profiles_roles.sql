-- Ordered baseline migration 002: core profile + role model.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  full_name text,
  phone text,
  country text,
  source text,
  status text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key
  on public.profiles (email)
  where email is not null;

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

insert into public.roles (code, name)
values
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('user', 'User')
on conflict (code) do update
set name = excluded.name;
