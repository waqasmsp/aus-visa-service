-- Bounded context: audit (append-only)

create schema if not exists audit;

create table if not exists audit.event_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function audit.prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit.event_log is append-only';
end;
$$;

drop trigger if exists trg_audit_event_log_no_update on audit.event_log;
create trigger trg_audit_event_log_no_update
before update on audit.event_log
for each row
execute function audit.prevent_mutation();

drop trigger if exists trg_audit_event_log_no_delete on audit.event_log;
create trigger trg_audit_event_log_no_delete
before delete on audit.event_log
for each row
execute function audit.prevent_mutation();
