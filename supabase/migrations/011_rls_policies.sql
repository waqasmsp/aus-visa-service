-- Ordered baseline migration 011: RLS policies.

alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.visa_applications enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.cms_pages enable row level security;
alter table public.blog_posts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.checkout_orders enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.webhook_audit_records enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists service_role_full_access_profiles on public.profiles;
create policy service_role_full_access_profiles
on public.profiles
for all
to service_role
using (true)
with check (true);
