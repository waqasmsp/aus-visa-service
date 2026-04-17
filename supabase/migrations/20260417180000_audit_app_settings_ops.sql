-- Cross-cutting ops hardening: app settings, sensitive-table auditing, and retention/partition strategy.

-- 1) Global application settings (separate from per-user settings).
create table if not exists public.app_settings (
  key text not null,
  value jsonb not null default '{}'::jsonb,
  scope text not null default 'global',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (key, scope)
);

create index if not exists app_settings_scope_key_idx
  on public.app_settings (scope, key);

create index if not exists app_settings_updated_at_idx
  on public.app_settings (updated_at desc);

drop trigger if exists trg_app_settings_set_updated_at on public.app_settings;
create trigger trg_app_settings_set_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

-- 2) Partitioned audit log table for immutable change records.
create table if not exists audit.audit_logs (
  id uuid not null default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);

create index if not exists audit_logs_entity_idx
  on audit.audit_logs (entity_type, entity_id, created_at desc);

create index if not exists audit_logs_actor_created_idx
  on audit.audit_logs (actor, created_at desc);

create index if not exists audit_logs_created_at_idx
  on audit.audit_logs (created_at desc);

create table if not exists audit.audit_logs_default
  partition of audit.audit_logs default;

-- 3) Generic helpers for request metadata + trigger-based audit capture.
create or replace function audit.current_request_ip()
returns inet
language plpgsql
stable
as $$
declare
  request_headers jsonb;
  source_ip text;
begin
  begin
    request_headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    request_headers := '{}'::jsonb;
  end;

  source_ip := split_part(coalesce(request_headers ->> 'x-forwarded-for', ''), ',', 1);

  if source_ip = '' then
    source_ip := request_headers ->> 'x-real-ip';
  end if;

  if source_ip is null or source_ip = '' then
    return null;
  end if;

  return source_ip::inet;
exception when others then
  return null;
end;
$$;

create or replace function audit.current_request_user_agent()
returns text
language plpgsql
stable
as $$
declare
  request_headers jsonb;
begin
  begin
    request_headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    request_headers := '{}'::jsonb;
  end;

  return nullif(request_headers ->> 'user-agent', '');
end;
$$;

create or replace function audit.capture_sensitive_change()
returns trigger
language plpgsql
security definer
set search_path = public, audit
as $$
declare
  row_before jsonb;
  row_after jsonb;
  target_entity_id text;
begin
  if tg_op = 'INSERT' then
    row_after := to_jsonb(new);
    target_entity_id := coalesce(row_after ->> 'id', row_after ->> 'key', row_after ->> 'code');
  elsif tg_op = 'UPDATE' then
    row_before := to_jsonb(old);
    row_after := to_jsonb(new);
    target_entity_id := coalesce(row_after ->> 'id', row_before ->> 'id', row_after ->> 'key', row_before ->> 'key', row_after ->> 'code', row_before ->> 'code');
  elsif tg_op = 'DELETE' then
    row_before := to_jsonb(old);
    target_entity_id := coalesce(row_before ->> 'id', row_before ->> 'key', row_before ->> 'code');
  end if;

  insert into audit.audit_logs (
    actor,
    action,
    entity_type,
    entity_id,
    before,
    after,
    ip,
    user_agent
  )
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_schema || '.' || tg_table_name,
    target_entity_id,
    row_before,
    row_after,
    audit.current_request_ip(),
    audit.current_request_user_agent()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function audit.attach_sensitive_audit_trigger(target_table regclass)
returns void
language plpgsql
as $$
declare
  target_schema text;
  target_name text;
  trigger_name text;
begin
  select n.nspname, c.relname
    into target_schema, target_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.oid = target_table;

  if target_schema is null then
    return;
  end if;

  trigger_name := format('trg_audit_%s_capture', target_name);

  execute format('drop trigger if exists %I on %I.%I', trigger_name, target_schema, target_name);
  execute format(
    'create trigger %I after insert or update or delete on %I.%I for each row execute function audit.capture_sensitive_change()',
    trigger_name,
    target_schema,
    target_name
  );
end;
$$;

-- 4) Partition management + retention policy for audit and high-volume webhook tables.
create or replace function audit.ensure_monthly_partition(
  parent_schema text,
  parent_table text,
  partition_prefix text,
  month_start date
)
returns void
language plpgsql
as $$
declare
  part_name text;
  start_ts timestamptz;
  end_ts timestamptz;
begin
  part_name := format('%s_p%s', partition_prefix, to_char(month_start, 'YYYYMM'));
  start_ts := date_trunc('month', month_start)::timestamptz;
  end_ts := (date_trunc('month', month_start) + interval '1 month')::timestamptz;

  execute format(
    'create table if not exists %I.%I partition of %I.%I for values from (%L) to (%L)',
    parent_schema,
    part_name,
    parent_schema,
    parent_table,
    start_ts,
    end_ts
  );
end;
$$;

create or replace function audit.apply_retention_policies(
  keep_audit_months integer default 18,
  create_months_ahead integer default 3
)
returns void
language plpgsql
as $$
declare
  month_cursor date;
  cutoff_month date;
  part record;
  yyyymm text;
  part_month date;
begin
  -- Ensure current + future partitions for audit logs.
  for i in 0..greatest(create_months_ahead, 0) loop
    month_cursor := (date_trunc('month', now()) + (i || ' month')::interval)::date;
    perform audit.ensure_monthly_partition('audit', 'audit_logs', 'audit_logs', month_cursor);
  end loop;

  -- Drop old audit log partitions by naming convention.
  cutoff_month := (date_trunc('month', now()) - (greatest(keep_audit_months, 0) || ' month')::interval)::date;
  for part in
    select c.relname
    from pg_inherits i
    join pg_class c on c.oid = i.inhrelid
    join pg_class p on p.oid = i.inhparent
    join pg_namespace n on n.oid = p.relnamespace
    where n.nspname = 'audit'
      and p.relname = 'audit_logs'
      and c.relname like 'audit_logs_p%'
  loop
    yyyymm := substring(part.relname from '([0-9]{6})$');
    if yyyymm is not null then
      part_month := to_date(yyyymm || '01', 'YYYYMMDD');
      if part_month < cutoff_month then
        execute format('drop table if exists audit.%I', part.relname);
      end if;
    end if;
  end loop;

  -- Row-level retention for webhook operational tables.
  delete from public.webhook_audit_records war
  where war.received_at < now() - interval '180 days'
    and war.processing_status in ('processed', 'failed', 'dead_letter')
    and not exists (
      select 1
      from public.webhook_queue wq
      where wq.webhook_audit_record_id = war.id
    )
    and not exists (
      select 1
      from public.webhook_dead_letters wdl
      where wdl.webhook_audit_record_id = war.id
    );

  delete from public.webhook_queue
  where processing_status in ('processed', 'discarded')
    and coalesce(last_attempt_at, queued_at) < now() - interval '30 days';

  delete from public.webhook_dead_letters
  where failed_at < now() - interval '180 days';
end;
$$;

-- Attach audit triggers to sensitive tables.
select audit.attach_sensitive_audit_trigger('public.profiles'::regclass);
select audit.attach_sensitive_audit_trigger('public.roles'::regclass);
select audit.attach_sensitive_audit_trigger('public.subscriptions'::regclass);
select audit.attach_sensitive_audit_trigger('public.payments'::regclass);
select audit.attach_sensitive_audit_trigger('public.user_settings'::regclass);
select audit.attach_sensitive_audit_trigger('public.app_settings'::regclass);

-- Create initial monthly partitions and prune old data opportunistically.
select audit.apply_retention_policies();

-- 5) Reporting layers for operations dashboards.
create or replace view audit.v_sensitive_changes_30d as
select
  date_trunc('day', created_at) as day,
  entity_type,
  action,
  count(*) as change_count,
  count(distinct actor) as distinct_actors
from audit.audit_logs
where created_at >= now() - interval '30 days'
group by 1, 2, 3;

create materialized view if not exists public.mv_webhook_operations_daily as
select
  date_trunc('day', received_at) as day,
  provider,
  count(*) as total_events,
  count(*) filter (where verification_result = 'verified') as verified_events,
  count(*) filter (where processing_status = 'processed') as processed_events,
  count(*) filter (where processing_status in ('failed', 'dead_letter')) as failed_events
from public.webhook_audit_records
group by 1, 2;

create unique index if not exists mv_webhook_operations_daily_day_provider_idx
  on public.mv_webhook_operations_daily (day, provider);
