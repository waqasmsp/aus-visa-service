-- Bounded context: cms/blog

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body_markdown text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_blog_posts_set_updated_at on public.blog_posts;
create trigger trg_blog_posts_set_updated_at
before update on public.blog_posts
for each row
execute function public.set_updated_at();

create index if not exists blog_posts_title_trgm_idx
  on public.blog_posts
  using gin (title gin_trgm_ops);
