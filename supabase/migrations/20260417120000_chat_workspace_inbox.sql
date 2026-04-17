-- Chat workspace v2: conversations, messages, assignment history, indexes, and RLS.

-- Preserve legacy table if it already exists with the old shape.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_messages'
      and column_name = 'chat_id'
  ) then
    execute 'alter table public.chat_messages rename to chat_messages_legacy';
  end if;
end
$$;

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  user_email citext,
  user_full_name text,
  channel text not null default 'web'
    check (channel in ('web', 'email', 'sms', 'whatsapp', 'in_app')),
  status text not null default 'open'
    check (status in ('open', 'pending', 'resolved', 'closed', 'archived')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_owner_id uuid references public.profiles(id) on delete set null,
  last_activity_at timestamptz not null default now(),
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_text text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill denormalized user info for existing rows when possible.
update public.chat_conversations c
set user_email = p.email,
    user_full_name = p.full_name
from public.profiles p
where p.id = c.user_id
  and (c.user_email is null or c.user_full_name is null);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'agent', 'system')),
  direction text not null check (direction in ('inbound', 'outbound')),
  message_text text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.chat_assignment_history (
  id bigserial primary key,
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  previous_owner_id uuid references public.profiles(id) on delete set null,
  new_owner_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

-- updated_at trigger

drop trigger if exists trg_chat_conversations_set_updated_at on public.chat_conversations;
create trigger trg_chat_conversations_set_updated_at
before update on public.chat_conversations
for each row
execute function public.set_updated_at();

-- Keep conversation metadata fresh from incoming messages.
create or replace function public.chat_messages_refresh_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations c
  set
    last_activity_at = new.sent_at,
    last_message_text = new.message_text,
    unread_count = case
      when new.direction = 'inbound' then c.unread_count + 1
      else c.unread_count
    end
  where c.id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_chat_messages_refresh_conversation on public.chat_messages;
create trigger trg_chat_messages_refresh_conversation
after insert on public.chat_messages
for each row
execute function public.chat_messages_refresh_conversation();

-- Track owner assignment changes.
create or replace function public.chat_conversations_track_assignment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_owner_id is distinct from old.assigned_owner_id then
    insert into public.chat_assignment_history (
      conversation_id,
      previous_owner_id,
      new_owner_id,
      reason,
      changed_by
    )
    values (
      new.id,
      old.assigned_owner_id,
      new.assigned_owner_id,
      'owner_reassigned',
      auth.uid()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_chat_conversations_track_assignment_changes on public.chat_conversations;
create trigger trg_chat_conversations_track_assignment_changes
after update of assigned_owner_id on public.chat_conversations
for each row
execute function public.chat_conversations_track_assignment_changes();

-- Required operational indexes.
create index if not exists chat_conversations_status_priority_last_activity_idx
  on public.chat_conversations (status, priority, last_activity_at desc)
  where deleted_at is null;

create index if not exists chat_conversations_assigned_owner_status_idx
  on public.chat_conversations (assigned_owner_id, status)
  where deleted_at is null;

create index if not exists chat_messages_conversation_sent_at_idx
  on public.chat_messages (conversation_id, sent_at desc)
  where deleted_at is null;

create index if not exists chat_conversations_search_fts_idx
  on public.chat_conversations
  using gin (to_tsvector('simple', coalesce(last_message_text, '') || ' ' || coalesce(user_email::text, '')));

create index if not exists chat_conversations_search_trgm_idx
  on public.chat_conversations
  using gin ((coalesce(last_message_text, '') || ' ' || coalesce(user_email::text, '')) gin_trgm_ops);

-- RLS helpers
create or replace function public.can_access_conversation(conversation_owner uuid, assigned_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.has_role('manager')
    or (
      (public.has_role('agent') or public.has_role('editor'))
      and assigned_owner = auth.uid()
    )
    or conversation_owner = auth.uid();
$$;

grant execute on function public.can_access_conversation(uuid, uuid) to authenticated;

-- RLS
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_assignment_history enable row level security;

-- End users: own conversations only.
drop policy if exists chat_conversations_end_user_select on public.chat_conversations;
create policy chat_conversations_end_user_select
on public.chat_conversations
for select
to authenticated
using (user_id = auth.uid() and deleted_at is null);

-- Agents/managers/admins per assignment/scope.
drop policy if exists chat_conversations_staff_select on public.chat_conversations;
create policy chat_conversations_staff_select
on public.chat_conversations
for select
to authenticated
using (
  deleted_at is null
  and public.can_access_conversation(user_id, assigned_owner_id)
);

-- Staff management policies.
drop policy if exists chat_conversations_staff_insert on public.chat_conversations;
create policy chat_conversations_staff_insert
on public.chat_conversations
for insert
to authenticated
with check (
  public.is_admin()
  or public.has_role('manager')
  or public.has_role('agent')
  or public.has_role('editor')
);

drop policy if exists chat_conversations_staff_update on public.chat_conversations;
create policy chat_conversations_staff_update
on public.chat_conversations
for update
to authenticated
using (public.can_access_conversation(user_id, assigned_owner_id))
with check (public.can_access_conversation(user_id, assigned_owner_id));

-- Admin full access.
drop policy if exists chat_conversations_admin_all on public.chat_conversations;
create policy chat_conversations_admin_all
on public.chat_conversations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Messages inherit access via parent conversation.
drop policy if exists chat_messages_select_policy on public.chat_messages;
create policy chat_messages_select_policy
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and public.can_access_conversation(c.user_id, c.assigned_owner_id)
      and c.deleted_at is null
  )
);

drop policy if exists chat_messages_insert_policy on public.chat_messages;
create policy chat_messages_insert_policy
on public.chat_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and public.can_access_conversation(c.user_id, c.assigned_owner_id)
      and c.deleted_at is null
  )
);

-- Assignment history visible to conversation participants and staff.
drop policy if exists chat_assignment_history_select_policy on public.chat_assignment_history;
create policy chat_assignment_history_select_policy
on public.chat_assignment_history
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and public.can_access_conversation(c.user_id, c.assigned_owner_id)
      and c.deleted_at is null
  )
);

-- Only staff/admin can append manual assignment history notes.
drop policy if exists chat_assignment_history_insert_policy on public.chat_assignment_history;
create policy chat_assignment_history_insert_policy
on public.chat_assignment_history
for insert
to authenticated
with check (
  public.is_admin()
  or public.has_role('manager')
  or public.has_role('agent')
  or public.has_role('editor')
);
