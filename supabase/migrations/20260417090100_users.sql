-- Bounded context: users

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create index if not exists users_email_trgm_idx
  on public.users
  using gin (email gin_trgm_ops);
