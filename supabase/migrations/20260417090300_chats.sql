-- Bounded context: chats

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_chats_set_updated_at on public.chats;
create trigger trg_chats_set_updated_at
before update on public.chats
for each row
execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id),
  role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_chat_messages_set_updated_at on public.chat_messages;
create trigger trg_chat_messages_set_updated_at
before update on public.chat_messages
for each row
execute function public.set_updated_at();
