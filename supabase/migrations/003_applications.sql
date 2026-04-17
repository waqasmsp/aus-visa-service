-- Ordered baseline migration 003: applications domain.

create table if not exists public.visa_applications (
  id uuid primary key default gen_random_uuid(),
  applicant text not null,
  email citext not null,
  visa_type text not null,
  destination_country text not null,
  priority text not null default 'medium',
  status text not null default 'submitted',
  owner_id uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  submitted_on date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  author text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists visa_applications_owner_status_idx
  on public.visa_applications (owner_id, status, submitted_on desc);
