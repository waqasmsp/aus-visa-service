-- Ordered baseline migration 011: RLS enablement and core policies.

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.user_activity_events enable row level security;

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

-- Own-profile reads and writes.
drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Role-based admin writes.
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write
on public.profiles
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists profile_roles_admin_write on public.profile_roles;
create policy profile_roles_admin_write
on public.profile_roles
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

-- Scoped manager reads (same-country visibility).
drop policy if exists profiles_manager_scoped_read on public.profiles;
create policy profiles_manager_scoped_read
on public.profiles
for select
to authenticated
using (
  public.has_role('manager')
  and exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.country is not distinct from profiles.country
  )
);

drop policy if exists user_activity_events_self_read on public.user_activity_events;
create policy user_activity_events_self_read
on public.user_activity_events
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists user_activity_events_manager_scoped_read on public.user_activity_events;
create policy user_activity_events_manager_scoped_read
on public.user_activity_events
for select
to authenticated
using (
  public.has_role('manager')
  and exists (
    select 1
    from public.profiles me
    join public.profiles target on target.id = user_activity_events.profile_id
    where me.id = auth.uid()
      and me.country is not distinct from target.country
  )
);

drop policy if exists user_activity_events_admin_write on public.user_activity_events;
create policy user_activity_events_admin_write
on public.user_activity_events
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

-- Service role unrestricted access for backend jobs.
drop policy if exists profiles_service_role_access on public.profiles;
create policy profiles_service_role_access
on public.profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists profile_roles_service_role_access on public.profile_roles;
create policy profile_roles_service_role_access
on public.profile_roles
for all
to service_role
using (true)
with check (true);

drop policy if exists user_activity_events_service_role_access on public.user_activity_events;
create policy user_activity_events_service_role_access
on public.user_activity_events
for all
to service_role
using (true)
with check (true);
