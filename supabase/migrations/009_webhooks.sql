-- Ordered baseline migration 009: webhook ingestion + replay handling.

create table if not exists public.webhook_audit_records (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  endpoint text not null,
  raw_payload jsonb not null,
  processing_status text not null default 'received',
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists public.webhook_dead_letters (
  id uuid primary key default gen_random_uuid(),
  webhook_audit_record_id uuid not null references public.webhook_audit_records(id) on delete cascade,
  attempts integer not null,
  error text not null,
  failed_at timestamptz not null default now()
);
