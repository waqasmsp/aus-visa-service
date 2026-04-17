-- Ordered baseline migration 010: global settings + audit logs.

create table if not exists public.app_settings (
  key text not null,
  scope text not null default 'global',
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (key, scope)
);

create table if not exists audit.audit_logs (
  id uuid not null default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);

create table if not exists audit.audit_logs_default
  partition of audit.audit_logs default;
