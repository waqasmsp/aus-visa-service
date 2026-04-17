-- Bounded context: seeds (idempotent baseline data)

insert into public.blog_posts (slug, title, body_markdown, status, published_at)
select
  'welcome-to-aus-visa-service',
  'Welcome to AUS Visa Service',
  'Initial seeded blog post.',
  'published',
  now()
where not exists (
  select 1 from public.blog_posts where slug = 'welcome-to-aus-visa-service'
);
