-- Ordered baseline migration 004: chat workspace domain.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'open',
  priority text not null default 'normal',
  assigned_owner_id uuid references public.profiles(id) on delete set null,
  last_activity_at timestamptz not null default now(),
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_role text not null,
  message_text text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists chat_conversations_owner_status_idx
  on public.chat_conversations (assigned_owner_id, status, last_activity_at desc);
