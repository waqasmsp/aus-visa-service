-- Bounded context: row level security baseline

alter table public.users enable row level security;
alter table public.applications enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.blog_posts enable row level security;
alter table public.user_settings enable row level security;

-- Example ownership policies (tighten per role model later).
drop policy if exists users_self_select on public.users;
create policy users_self_select
on public.users
for select
using (auth.uid() = id);

-- Remaining tables should receive explicit policies in dedicated follow-up migrations.
