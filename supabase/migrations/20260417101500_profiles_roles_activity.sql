-- Identity + authorization model anchored to auth.users

-- 1) User profiles keyed to auth.users
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

-- unique profile email (denormalized from auth.users.email)
create unique index if not exists profiles_email_key
  on public.profiles (email)
  where email is not null;

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_last_seen_at_idx on public.profiles (last_seen_at desc);
create index if not exists profiles_country_idx on public.profiles (country);
create index if not exists profiles_source_idx on public.profiles (source);

-- optional sync helper from auth.users email -> public.profiles.email
create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_auth_users_sync_profile_email on auth.users;
create trigger trg_auth_users_sync_profile_email
after insert or update of email on auth.users
for each row
execute function public.sync_profile_email_from_auth();

-- 2) Role model
create table if not exists public.roles (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  constraint roles_code_check check (code in ('admin', 'manager', 'editor', 'user'))
);

insert into public.roles (code, name)
values
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('user', 'User')
on conflict (code) do update
set name = excluded.name;

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create index if not exists profile_roles_role_id_idx on public.profile_roles (role_id);

-- 3) Timeline events for user activity
create table if not exists public.user_activity_events (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_action text not null,
  event_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint user_activity_events_event_type_check
    check (event_type in ('activity', 'application', 'payment', 'support'))
);

create index if not exists user_activity_events_profile_event_at_idx
  on public.user_activity_events (profile_id, event_at desc);
create index if not exists user_activity_events_event_type_idx
  on public.user_activity_events (event_type, event_at desc);

-- shared updated_at trigger

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 4) Role helper functions used by RLS policies
create or replace function public.has_role(role_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = auth.uid()
      and r.code = role_code
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- 5) RLS policies
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.user_activity_events enable row level security;

-- profiles: self-service + manager/admin oversight

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
on public.profiles
for select
using (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_manager_admin_select on public.profiles;
create policy profiles_manager_admin_select
on public.profiles
for select
using (public.has_role('manager') or public.is_admin());

drop policy if exists profiles_manager_admin_update on public.profiles;
create policy profiles_manager_admin_update
on public.profiles
for update
using (public.has_role('manager') or public.is_admin())
with check (public.has_role('manager') or public.is_admin());

-- roles readable by authenticated users; immutable for non-admins

drop policy if exists roles_authenticated_select on public.roles;
create policy roles_authenticated_select
on public.roles
for select
using (auth.uid() is not null);

-- profile_roles: only admins can manage assignments

drop policy if exists profile_roles_admin_select on public.profile_roles;
create policy profile_roles_admin_select
on public.profile_roles
for select
using (public.is_admin());

drop policy if exists profile_roles_admin_insert on public.profile_roles;
create policy profile_roles_admin_insert
on public.profile_roles
for insert
with check (public.is_admin());

drop policy if exists profile_roles_admin_update on public.profile_roles;
create policy profile_roles_admin_update
on public.profile_roles
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists profile_roles_admin_delete on public.profile_roles;
create policy profile_roles_admin_delete
on public.profile_roles
for delete
using (public.is_admin());

-- activity events visibility: self and manager/admin

drop policy if exists user_activity_events_self_select on public.user_activity_events;
create policy user_activity_events_self_select
on public.user_activity_events
for select
using (profile_id = auth.uid());

drop policy if exists user_activity_events_manager_admin_select on public.user_activity_events;
create policy user_activity_events_manager_admin_select
on public.user_activity_events
for select
using (public.has_role('manager') or public.is_admin());

drop policy if exists user_activity_events_self_insert on public.user_activity_events;
create policy user_activity_events_self_insert
on public.user_activity_events
for insert
with check (profile_id = auth.uid());

drop policy if exists user_activity_events_manager_admin_insert on public.user_activity_events;
create policy user_activity_events_manager_admin_insert
on public.user_activity_events
for insert
with check (public.has_role('manager') or public.is_admin());
