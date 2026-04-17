-- Bounded context: applications

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  status text not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_applications_set_updated_at on public.applications;
create trigger trg_applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

create index if not exists applications_user_status_idx
  on public.applications using gin (user_id, status);
