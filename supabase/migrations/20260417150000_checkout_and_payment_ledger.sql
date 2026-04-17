-- Checkout and payment domain expansion: order/session lifecycle, processor entities,
-- immutable ledgering, and reconciliation tracking.

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id),
  user_id uuid not null references public.users(id),
  status text not null default 'draft',
  currency text not null,
  subtotal_amount bigint not null default 0,
  tax_amount bigint not null default 0,
  discount_amount bigint not null default 0,
  total_amount bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint checkout_orders_subtotal_amount_check check (subtotal_amount >= 0),
  constraint checkout_orders_tax_amount_check check (tax_amount >= 0),
  constraint checkout_orders_discount_amount_check check (discount_amount >= 0),
  constraint checkout_orders_total_amount_check check (total_amount >= 0)
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  checkout_order_id uuid not null references public.checkout_orders(id) on delete cascade,
  application_id uuid references public.applications(id),
  user_id uuid not null references public.users(id),
  provider text not null,
  provider_session_id text,
  status text not null default 'open',
  expires_at timestamptz,
  completed_at timestamptz,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint checkout_sessions_provider_session_unique unique (provider, provider_session_id),
  constraint checkout_sessions_idempotency_key_unique unique (idempotency_key)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  checkout_order_id uuid references public.checkout_orders(id),
  checkout_session_id uuid references public.checkout_sessions(id),
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  method text,
  state text not null,
  provider_reference text,
  processor_reference text,
  provider_event_id text,
  failure_code text,
  failure_message text,
  amount bigint,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint payment_transactions_amount_check check (amount is null or amount >= 0),
  constraint payment_transactions_provider_reference_unique unique (provider, provider_reference),
  constraint payment_transactions_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  payment_transaction_id uuid references public.payment_transactions(id) on delete cascade,
  checkout_order_id uuid references public.checkout_orders(id),
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  provider_intent_id text not null,
  provider_event_id text,
  status text not null,
  amount bigint,
  currency text,
  capture_method text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_intents_amount_check check (amount is null or amount >= 0),
  constraint payment_intents_provider_intent_unique unique (provider, provider_intent_id),
  constraint payment_intents_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  payment_transaction_id uuid references public.payment_transactions(id) on delete cascade,
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  provider_charge_id text not null,
  provider_event_id text,
  status text not null,
  amount bigint not null,
  currency text not null,
  captured_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charges_amount_check check (amount >= 0),
  constraint charges_provider_charge_unique unique (provider, provider_charge_id),
  constraint charges_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid references public.charges(id) on delete cascade,
  payment_transaction_id uuid references public.payment_transactions(id) on delete cascade,
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  provider_refund_id text not null,
  provider_event_id text,
  status text not null,
  amount bigint not null,
  currency text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refunds_amount_check check (amount >= 0),
  constraint refunds_provider_refund_unique unique (provider, provider_refund_id),
  constraint refunds_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid references public.charges(id) on delete set null,
  payment_transaction_id uuid references public.payment_transactions(id) on delete cascade,
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  provider_dispute_id text not null,
  provider_event_id text,
  status text not null,
  reason text,
  amount bigint,
  currency text,
  due_by timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disputes_amount_check check (amount is null or amount >= 0),
  constraint disputes_provider_dispute_unique unique (provider, provider_dispute_id),
  constraint disputes_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  provider_invoice_id text not null,
  provider_event_id text,
  status text not null,
  total_amount bigint,
  paid_amount bigint,
  currency text,
  due_date timestamptz,
  finalized_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_total_amount_check check (total_amount is null or total_amount >= 0),
  constraint invoices_paid_amount_check check (paid_amount is null or paid_amount >= 0),
  constraint invoices_provider_invoice_unique unique (provider, provider_invoice_id),
  constraint invoices_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text not null,
  provider_payout_id text not null,
  provider_event_id text,
  status text not null,
  amount bigint not null,
  currency text not null,
  arrival_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payouts_amount_check check (amount >= 0),
  constraint payouts_provider_payout_unique unique (provider, provider_payout_id),
  constraint payouts_provider_event_unique unique (provider, provider_event_id)
);

create table if not exists public.transaction_ledger (
  id uuid primary key default gen_random_uuid(),
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  application_id uuid references public.applications(id),
  user_id uuid references public.users(id),
  provider text,
  event_type text not null,
  transaction_type text not null,
  actor text not null,
  reference_data jsonb not null default '{}'::jsonb,
  amount bigint,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint transaction_ledger_amount_check check (amount is null or amount >= 0)
);

create table if not exists public.reconciliation_mismatches (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  settlement_date date not null,
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  provider_reference text,
  mismatch_type text not null,
  expected_amount bigint,
  settled_amount bigint,
  currency text,
  status text not null default 'open',
  resolution_notes text,
  metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reconciliation_mismatches_expected_amount_check check (expected_amount is null or expected_amount >= 0),
  constraint reconciliation_mismatches_settled_amount_check check (settled_amount is null or settled_amount >= 0)
);

-- Idempotent write helpers for webhook flows.
create or replace function public.upsert_payment_transaction_from_webhook(
  p_provider text,
  p_provider_event_id text,
  p_provider_reference text,
  p_state text,
  p_method text,
  p_processor_reference text,
  p_checkout_order_id uuid,
  p_checkout_session_id uuid,
  p_application_id uuid,
  p_user_id uuid,
  p_amount bigint,
  p_currency text,
  p_failure_code text default null,
  p_failure_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payment_transactions
language plpgsql
as $$
declare
  v_row public.payment_transactions;
begin
  insert into public.payment_transactions (
    provider,
    provider_event_id,
    provider_reference,
    state,
    method,
    processor_reference,
    checkout_order_id,
    checkout_session_id,
    application_id,
    user_id,
    amount,
    currency,
    failure_code,
    failure_message,
    metadata
  )
  values (
    p_provider,
    p_provider_event_id,
    p_provider_reference,
    p_state,
    p_method,
    p_processor_reference,
    p_checkout_order_id,
    p_checkout_session_id,
    p_application_id,
    p_user_id,
    p_amount,
    p_currency,
    p_failure_code,
    p_failure_message,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, provider_event_id)
  do update
    set state = excluded.state,
        method = excluded.method,
        processor_reference = excluded.processor_reference,
        failure_code = excluded.failure_code,
        failure_message = excluded.failure_message,
        amount = excluded.amount,
        currency = excluded.currency,
        metadata = public.payment_transactions.metadata || excluded.metadata,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.upsert_payment_intent_from_webhook(
  p_provider text,
  p_provider_intent_id text,
  p_provider_event_id text,
  p_payment_transaction_id uuid,
  p_checkout_order_id uuid,
  p_application_id uuid,
  p_user_id uuid,
  p_status text,
  p_amount bigint,
  p_currency text,
  p_capture_method text,
  p_occurred_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payment_intents
language plpgsql
as $$
declare
  v_row public.payment_intents;
begin
  insert into public.payment_intents (
    provider,
    provider_intent_id,
    provider_event_id,
    payment_transaction_id,
    checkout_order_id,
    application_id,
    user_id,
    status,
    amount,
    currency,
    capture_method,
    occurred_at,
    metadata
  )
  values (
    p_provider,
    p_provider_intent_id,
    p_provider_event_id,
    p_payment_transaction_id,
    p_checkout_order_id,
    p_application_id,
    p_user_id,
    p_status,
    p_amount,
    p_currency,
    p_capture_method,
    coalesce(p_occurred_at, now()),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, provider_intent_id)
  do update
    set provider_event_id = excluded.provider_event_id,
        payment_transaction_id = coalesce(excluded.payment_transaction_id, public.payment_intents.payment_transaction_id),
        status = excluded.status,
        amount = excluded.amount,
        currency = excluded.currency,
        capture_method = excluded.capture_method,
        occurred_at = excluded.occurred_at,
        metadata = public.payment_intents.metadata || excluded.metadata,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.prevent_transaction_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'transaction_ledger is immutable: % is not allowed', tg_op;
end;
$$;

create index if not exists checkout_orders_application_user_idx
  on public.checkout_orders (application_id, user_id);

create index if not exists checkout_sessions_provider_created_at_idx
  on public.checkout_sessions (provider, created_at desc);

create index if not exists checkout_sessions_application_user_idx
  on public.checkout_sessions (application_id, user_id);

create index if not exists payment_transactions_provider_created_at_idx
  on public.payment_transactions (provider, created_at desc);

create index if not exists payment_transactions_application_user_idx
  on public.payment_transactions (application_id, user_id);

create unique index if not exists payment_transactions_provider_reference_uidx
  on public.payment_transactions (provider_reference)
  where provider_reference is not null;

create index if not exists payment_intents_provider_created_at_idx
  on public.payment_intents (provider, created_at desc);

create index if not exists payment_intents_application_user_idx
  on public.payment_intents (application_id, user_id);

create unique index if not exists payment_intents_provider_reference_uidx
  on public.payment_intents (provider_intent_id);

create index if not exists charges_provider_created_at_idx
  on public.charges (provider, created_at desc);

create index if not exists charges_application_user_idx
  on public.charges (application_id, user_id);

create unique index if not exists charges_provider_reference_uidx
  on public.charges (provider_charge_id);

create index if not exists refunds_provider_created_at_idx
  on public.refunds (provider, created_at desc);

create index if not exists refunds_application_user_idx
  on public.refunds (application_id, user_id);

create unique index if not exists refunds_provider_reference_uidx
  on public.refunds (provider_refund_id);

create index if not exists disputes_provider_created_at_idx
  on public.disputes (provider, created_at desc);

create index if not exists disputes_application_user_idx
  on public.disputes (application_id, user_id);

create unique index if not exists disputes_provider_reference_uidx
  on public.disputes (provider_dispute_id);

create index if not exists invoices_provider_created_at_idx
  on public.invoices (provider, created_at desc);

create index if not exists invoices_application_user_idx
  on public.invoices (application_id, user_id);

create unique index if not exists invoices_provider_reference_uidx
  on public.invoices (provider_invoice_id);

create index if not exists payouts_provider_created_at_idx
  on public.payouts (provider, created_at desc);

create index if not exists payouts_application_user_idx
  on public.payouts (application_id, user_id);

create unique index if not exists payouts_provider_reference_uidx
  on public.payouts (provider_payout_id);

create index if not exists transaction_ledger_provider_created_at_idx
  on public.transaction_ledger (provider, created_at desc);

create index if not exists transaction_ledger_application_user_idx
  on public.transaction_ledger (application_id, user_id);

create index if not exists reconciliation_mismatches_provider_created_at_idx
  on public.reconciliation_mismatches (provider, created_at desc);

create index if not exists reconciliation_mismatches_provider_reference_idx
  on public.reconciliation_mismatches (provider_reference)
  where provider_reference is not null;

-- updated_at triggers.
drop trigger if exists trg_checkout_orders_set_updated_at on public.checkout_orders;
create trigger trg_checkout_orders_set_updated_at
before update on public.checkout_orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_checkout_sessions_set_updated_at on public.checkout_sessions;
create trigger trg_checkout_sessions_set_updated_at
before update on public.checkout_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_payment_transactions_set_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_set_updated_at
before update on public.payment_transactions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_payment_intents_set_updated_at on public.payment_intents;
create trigger trg_payment_intents_set_updated_at
before update on public.payment_intents
for each row
execute function public.set_updated_at();

drop trigger if exists trg_charges_set_updated_at on public.charges;
create trigger trg_charges_set_updated_at
before update on public.charges
for each row
execute function public.set_updated_at();

drop trigger if exists trg_refunds_set_updated_at on public.refunds;
create trigger trg_refunds_set_updated_at
before update on public.refunds
for each row
execute function public.set_updated_at();

drop trigger if exists trg_disputes_set_updated_at on public.disputes;
create trigger trg_disputes_set_updated_at
before update on public.disputes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_invoices_set_updated_at on public.invoices;
create trigger trg_invoices_set_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

drop trigger if exists trg_payouts_set_updated_at on public.payouts;
create trigger trg_payouts_set_updated_at
before update on public.payouts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_reconciliation_mismatches_set_updated_at on public.reconciliation_mismatches;
create trigger trg_reconciliation_mismatches_set_updated_at
before update on public.reconciliation_mismatches
for each row
execute function public.set_updated_at();

-- Immutable ledger protections.
drop trigger if exists trg_transaction_ledger_prevent_update on public.transaction_ledger;
create trigger trg_transaction_ledger_prevent_update
before update on public.transaction_ledger
for each row
execute function public.prevent_transaction_ledger_mutation();

drop trigger if exists trg_transaction_ledger_prevent_delete on public.transaction_ledger;
create trigger trg_transaction_ledger_prevent_delete
before delete on public.transaction_ledger
for each row
execute function public.prevent_transaction_ledger_mutation();
