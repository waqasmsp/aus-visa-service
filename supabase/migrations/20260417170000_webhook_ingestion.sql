-- Bounded context: webhook ingestion, retry queue, and dead letter handling

create table if not exists public.webhook_audit_records (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint text not null,
  event_id text not null,
  raw_payload jsonb not null,
  headers jsonb not null default '{}'::jsonb,
  verification_result text not null default 'unverified',
  processing_status text not null default 'received',
  verification_error text,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_webhook_audit_records_set_updated_at on public.webhook_audit_records;
create trigger trg_webhook_audit_records_set_updated_at
before update on public.webhook_audit_records
for each row
execute function public.set_updated_at();

create unique index if not exists webhook_audit_records_provider_event_id_uk
  on public.webhook_audit_records (provider, event_id);

create index if not exists webhook_audit_records_processing_status_idx
  on public.webhook_audit_records (processing_status, received_at);

create table if not exists public.webhook_queue (
  id uuid primary key default gen_random_uuid(),
  webhook_audit_record_id uuid not null references public.webhook_audit_records(id) on delete cascade,
  provider text not null,
  event_id text not null,
  internal_event_type text not null,
  processing_status text not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 10,
  retry_backoff_seconds integer not null default 60,
  queued_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_attempt_at timestamptz,
  last_error text,
  worker_hint text,
  cron_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_webhook_queue_set_updated_at on public.webhook_queue;
create trigger trg_webhook_queue_set_updated_at
before update on public.webhook_queue
for each row
execute function public.set_updated_at();

create index if not exists webhook_queue_next_attempt_idx
  on public.webhook_queue (processing_status, next_attempt_at);

create index if not exists webhook_queue_worker_lock_idx
  on public.webhook_queue (locked_at, locked_by);

create table if not exists public.webhook_dead_letters (
  id uuid primary key default gen_random_uuid(),
  webhook_audit_record_id uuid not null references public.webhook_audit_records(id) on delete cascade,
  webhook_queue_id uuid references public.webhook_queue(id) on delete set null,
  provider text not null,
  event_id text not null,
  internal_event_type text,
  attempts integer not null,
  failed_payload_reference text,
  error text not null,
  failed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists webhook_dead_letters_failed_at_idx
  on public.webhook_dead_letters (failed_at desc);

-- Restrict access to raw webhook payload data.
revoke all on table public.webhook_audit_records from anon, authenticated;
revoke all on table public.webhook_dead_letters from anon, authenticated;

grant all on table public.webhook_audit_records to service_role;
grant all on table public.webhook_dead_letters to service_role;
