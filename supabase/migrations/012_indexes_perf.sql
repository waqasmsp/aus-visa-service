-- Ordered baseline migration 012: index + performance hardening.

create index if not exists visa_applications_status_submitted_on_idx
  on public.visa_applications (status, submitted_on desc);

create index if not exists chat_messages_conversation_sent_idx
  on public.chat_messages (conversation_id, sent_at desc);

create index if not exists cms_pages_status_locale_updated_idx
  on public.cms_pages (status, locale, updated_at desc);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc nulls last);

create index if not exists subscriptions_status_next_billing_idx
  on public.subscriptions (status, next_billing_date);

create index if not exists webhook_audit_records_status_received_idx
  on public.webhook_audit_records (processing_status, received_at);
