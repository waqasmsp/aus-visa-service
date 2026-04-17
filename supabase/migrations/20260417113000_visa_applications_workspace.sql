-- Visa applications workspace domain

create table if not exists public.visa_applications (
  id uuid primary key default gen_random_uuid(),
  applicant text not null,
  email citext not null,
  visa_type text not null,
  destination_country text not null,
  priority text not null default 'medium',
  status text not null default 'submitted',
  sla_risk text not null default 'low',
  owner_id uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  submitted_on date not null default (timezone('utc', now()))::date,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visa_applications_priority_check
    check (priority in ('low', 'medium', 'high')),
  constraint visa_applications_status_check
    check (status in ('submitted', 'in_review', 'documents_needed', 'approved', 'completed', 'rejected')),
  constraint visa_applications_sla_risk_check
    check (sla_risk in ('low', 'medium', 'high', 'critical')),
  constraint visa_applications_applicant_not_blank_check
    check (length(btrim(applicant)) > 0),
  constraint visa_applications_email_not_blank_check
    check (length(btrim(email::text)) > 0),
  constraint visa_applications_deleted_consistency_check
    check ((is_deleted = false and deleted_at is null) or (is_deleted = true and deleted_at is not null))
);

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  author text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint application_notes_author_not_blank_check
    check (length(btrim(author)) > 0),
  constraint application_notes_message_not_blank_check
    check (length(btrim(message)) > 0)
);

create table if not exists public.application_timeline_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  label text not null,
  actor text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint application_timeline_events_label_not_blank_check
    check (length(btrim(label)) > 0),
  constraint application_timeline_events_actor_not_blank_check
    check (length(btrim(actor)) > 0)
);

create table if not exists public.application_audit_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  action text not null,
  actor text not null,
  "timestamp" timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint application_audit_events_action_not_blank_check
    check (length(btrim(action)) > 0),
  constraint application_audit_events_actor_not_blank_check
    check (length(btrim(actor)) > 0)
);

create table if not exists public.application_document_stats (
  application_id uuid primary key references public.visa_applications(id) on delete cascade,
  total integer not null default 0,
  verified integer not null default 0,
  pending integer not null default 0,
  rejected integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint application_document_stats_non_negative_check
    check (total >= 0 and verified >= 0 and pending >= 0 and rejected >= 0),
  constraint application_document_stats_sum_check
    check (total = verified + pending + rejected)
);

drop trigger if exists trg_visa_applications_set_updated_at on public.visa_applications;
create trigger trg_visa_applications_set_updated_at
before update on public.visa_applications
for each row
execute function public.set_updated_at();

drop trigger if exists trg_application_document_stats_set_updated_at on public.application_document_stats;
create trigger trg_application_document_stats_set_updated_at
before update on public.application_document_stats
for each row
execute function public.set_updated_at();

create index if not exists visa_applications_status_priority_submitted_on_idx
  on public.visa_applications (status, priority, submitted_on);

create index if not exists visa_applications_owner_status_idx
  on public.visa_applications (owner_id, status);

create index if not exists visa_applications_assigned_to_status_idx
  on public.visa_applications (assigned_to, status);

create index if not exists visa_applications_applicant_trgm_idx
  on public.visa_applications using gin (applicant gin_trgm_ops);

create index if not exists visa_applications_email_trgm_idx
  on public.visa_applications using gin ((email::text) gin_trgm_ops);

create index if not exists application_notes_application_id_created_at_idx
  on public.application_notes (application_id, created_at desc);

create index if not exists application_timeline_events_application_id_occurred_at_idx
  on public.application_timeline_events (application_id, occurred_at desc);

create index if not exists application_audit_events_application_id_timestamp_idx
  on public.application_audit_events (application_id, "timestamp" desc);

alter table public.visa_applications enable row level security;
alter table public.application_notes enable row level security;
alter table public.application_timeline_events enable row level security;
alter table public.application_audit_events enable row level security;
alter table public.application_document_stats enable row level security;

-- Applications: owners can read their rows, assigned agents can read assigned rows,
-- and managers/admins have broad access.
drop policy if exists visa_applications_owner_select on public.visa_applications;
create policy visa_applications_owner_select
on public.visa_applications
for select
using (owner_id = auth.uid());

drop policy if exists visa_applications_assigned_select on public.visa_applications;
create policy visa_applications_assigned_select
on public.visa_applications
for select
using (assigned_to = auth.uid());

drop policy if exists visa_applications_agent_manager_admin_select on public.visa_applications;
create policy visa_applications_agent_manager_admin_select
on public.visa_applications
for select
using (public.has_role('editor') or public.has_role('manager') or public.is_admin());

drop policy if exists visa_applications_owner_insert on public.visa_applications;
create policy visa_applications_owner_insert
on public.visa_applications
for insert
with check (
  owner_id = auth.uid()
  or public.has_role('editor')
  or public.has_role('manager')
  or public.is_admin()
);

drop policy if exists visa_applications_owner_or_assigned_update_non_privileged on public.visa_applications;
create policy visa_applications_owner_or_assigned_update_non_privileged
on public.visa_applications
for update
using (owner_id = auth.uid() or assigned_to = auth.uid())
with check (
  (owner_id = auth.uid() or assigned_to = auth.uid())
  and status is not distinct from (
    select current_row.status
    from public.visa_applications as current_row
    where current_row.id = visa_applications.id
  )
  and assigned_to is not distinct from (
    select current_row.assigned_to
    from public.visa_applications as current_row
    where current_row.id = visa_applications.id
  )
);

drop policy if exists visa_applications_privileged_update on public.visa_applications;
create policy visa_applications_privileged_update
on public.visa_applications
for update
using (public.has_role('editor') or public.has_role('manager') or public.is_admin())
with check (public.has_role('editor') or public.has_role('manager') or public.is_admin());

drop policy if exists visa_applications_privileged_delete on public.visa_applications;
create policy visa_applications_privileged_delete
on public.visa_applications
for delete
using (public.has_role('manager') or public.is_admin());

-- Child table access inherits from parent visibility.
drop policy if exists application_notes_select_by_parent on public.application_notes;
create policy application_notes_select_by_parent
on public.application_notes
for select
using (
  exists (
    select 1
    from public.visa_applications va
    where va.id = application_notes.application_id
      and (
        va.owner_id = auth.uid()
        or va.assigned_to = auth.uid()
        or public.has_role('editor')
        or public.has_role('manager')
        or public.is_admin()
      )
  )
);

drop policy if exists application_notes_insert_by_parent on public.application_notes;
create policy application_notes_insert_by_parent
on public.application_notes
for insert
with check (
  exists (
    select 1
    from public.visa_applications va
    where va.id = application_notes.application_id
      and (
        va.owner_id = auth.uid()
        or va.assigned_to = auth.uid()
        or public.has_role('editor')
        or public.has_role('manager')
        or public.is_admin()
      )
  )
);

drop policy if exists application_timeline_events_select_by_parent on public.application_timeline_events;
create policy application_timeline_events_select_by_parent
on public.application_timeline_events
for select
using (
  exists (
    select 1
    from public.visa_applications va
    where va.id = application_timeline_events.application_id
      and (
        va.owner_id = auth.uid()
        or va.assigned_to = auth.uid()
        or public.has_role('editor')
        or public.has_role('manager')
        or public.is_admin()
      )
  )
);

drop policy if exists application_timeline_events_insert_privileged on public.application_timeline_events;
create policy application_timeline_events_insert_privileged
on public.application_timeline_events
for insert
with check (public.has_role('editor') or public.has_role('manager') or public.is_admin());

drop policy if exists application_audit_events_select_privileged on public.application_audit_events;
create policy application_audit_events_select_privileged
on public.application_audit_events
for select
using (public.has_role('manager') or public.is_admin());

drop policy if exists application_audit_events_insert_privileged on public.application_audit_events;
create policy application_audit_events_insert_privileged
on public.application_audit_events
for insert
with check (public.has_role('editor') or public.has_role('manager') or public.is_admin());

drop policy if exists application_document_stats_select_by_parent on public.application_document_stats;
create policy application_document_stats_select_by_parent
on public.application_document_stats
for select
using (
  exists (
    select 1
    from public.visa_applications va
    where va.id = application_document_stats.application_id
      and (
        va.owner_id = auth.uid()
        or va.assigned_to = auth.uid()
        or public.has_role('editor')
        or public.has_role('manager')
        or public.is_admin()
      )
  )
);

drop policy if exists application_document_stats_update_privileged on public.application_document_stats;
create policy application_document_stats_update_privileged
on public.application_document_stats
for update
using (public.has_role('editor') or public.has_role('manager') or public.is_admin())
with check (public.has_role('editor') or public.has_role('manager') or public.is_admin());

