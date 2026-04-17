-- Blog editorial model: richer post schema, taxonomy, revisions, and RLS.

alter table public.blog_posts
  add column if not exists excerpt text,
  add column if not exists content_html text,
  add column if not exists content_blocks jsonb not null default '[]'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_canonical_url text,
  add column if not exists seo_keywords text[] not null default '{}'::text[],
  add column if not exists schema_type text not null default 'Article',
  add column if not exists visibility text not null default 'public',
  add column if not exists scheduled_at timestamptz,
  add column if not exists author_id uuid references public.profiles(id) on delete set null,
  add column if not exists last_edited_by uuid references public.profiles(id) on delete set null,
  add column if not exists version integer not null default 1,
  add column if not exists reading_time_minutes integer not null default 0,
  add column if not exists word_count integer not null default 0,
  add column if not exists view_count bigint not null default 0;

-- The initial schema used body_markdown. Keep it nullable for backward compatibility,
-- while moving new editors to content_html/content_blocks.
alter table public.blog_posts
  alter column body_markdown drop not null;

alter table public.blog_posts
  drop constraint if exists blog_posts_slug_key;

alter table public.blog_posts
  add constraint blog_posts_status_check
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  add constraint blog_posts_visibility_check
    check (visibility in ('public', 'members', 'private')),
  add constraint blog_posts_version_check
    check (version > 0),
  add constraint blog_posts_reading_time_minutes_check
    check (reading_time_minutes >= 0),
  add constraint blog_posts_word_count_check
    check (word_count >= 0),
  add constraint blog_posts_view_count_check
    check (view_count >= 0),
  add constraint blog_posts_schedule_order_check
    check (scheduled_at is null or published_at is null or scheduled_at <= published_at);

create unique index if not exists blog_posts_public_slug_key
  on public.blog_posts (slug)
  where visibility = 'public' and deleted_at is null;

create table if not exists public.blog_categories (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_tags (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_post_categories (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  category_id bigint not null references public.blog_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, category_id)
);

create table if not exists public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id bigint not null references public.blog_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table if not exists public.blog_revisions (
  id bigserial primary key,
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  version integer not null check (version > 0),
  edited_by uuid references public.profiles(id) on delete set null,
  edited_by_role text,
  edited_at timestamptz not null default now(),
  summary text,
  snapshot jsonb not null,
  constraint blog_revisions_post_id_version_key unique (post_id, version)
);

create index if not exists blog_posts_status_visibility_published_at_idx
  on public.blog_posts (status, visibility, published_at desc);

create index if not exists blog_posts_title_excerpt_trgm_idx
  on public.blog_posts
  using gin ((coalesce(title, '') || ' ' || coalesce(excerpt, '')) gin_trgm_ops);

create index if not exists blog_post_categories_category_post_idx
  on public.blog_post_categories (category_id, post_id);

create index if not exists blog_post_tags_tag_post_idx
  on public.blog_post_tags (tag_id, post_id);

create index if not exists blog_revisions_post_edited_at_idx
  on public.blog_revisions (post_id, edited_at desc);

create index if not exists blog_revisions_snapshot_gin_idx
  on public.blog_revisions
  using gin (snapshot jsonb_path_ops);

create or replace function public.is_editorial()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('editor')
    or public.has_role('manager')
    or public.is_admin();
$$;

grant execute on function public.is_editorial() to authenticated;

alter table public.blog_posts enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_post_categories enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.blog_revisions enable row level security;

-- Blog posts: public can read only published+public; editorial can fully manage.
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read
on public.blog_posts
for select
using (
  status = 'published'
  and visibility = 'public'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists blog_posts_editorial_select on public.blog_posts;
create policy blog_posts_editorial_select
on public.blog_posts
for select
using (public.is_editorial());

drop policy if exists blog_posts_editorial_insert on public.blog_posts;
create policy blog_posts_editorial_insert
on public.blog_posts
for insert
with check (public.is_editorial());

drop policy if exists blog_posts_editorial_update on public.blog_posts;
create policy blog_posts_editorial_update
on public.blog_posts
for update
using (public.is_editorial())
with check (public.is_editorial());

drop policy if exists blog_posts_editorial_delete on public.blog_posts;
create policy blog_posts_editorial_delete
on public.blog_posts
for delete
using (public.is_editorial());

-- Taxonomy: read for all, write for editorial roles.
drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read
on public.blog_categories
for select
using (true);

drop policy if exists blog_categories_editorial_insert on public.blog_categories;
create policy blog_categories_editorial_insert
on public.blog_categories
for insert
with check (public.is_editorial());

drop policy if exists blog_categories_editorial_update on public.blog_categories;
create policy blog_categories_editorial_update
on public.blog_categories
for update
using (public.is_editorial())
with check (public.is_editorial());

drop policy if exists blog_categories_editorial_delete on public.blog_categories;
create policy blog_categories_editorial_delete
on public.blog_categories
for delete
using (public.is_editorial());

drop policy if exists blog_tags_public_read on public.blog_tags;
create policy blog_tags_public_read
on public.blog_tags
for select
using (true);

drop policy if exists blog_tags_editorial_insert on public.blog_tags;
create policy blog_tags_editorial_insert
on public.blog_tags
for insert
with check (public.is_editorial());

drop policy if exists blog_tags_editorial_update on public.blog_tags;
create policy blog_tags_editorial_update
on public.blog_tags
for update
using (public.is_editorial())
with check (public.is_editorial());

drop policy if exists blog_tags_editorial_delete on public.blog_tags;
create policy blog_tags_editorial_delete
on public.blog_tags
for delete
using (public.is_editorial());

drop policy if exists blog_post_categories_public_read on public.blog_post_categories;
create policy blog_post_categories_public_read
on public.blog_post_categories
for select
using (true);

drop policy if exists blog_post_categories_editorial_insert on public.blog_post_categories;
create policy blog_post_categories_editorial_insert
on public.blog_post_categories
for insert
with check (public.is_editorial());

drop policy if exists blog_post_categories_editorial_delete on public.blog_post_categories;
create policy blog_post_categories_editorial_delete
on public.blog_post_categories
for delete
using (public.is_editorial());

drop policy if exists blog_post_tags_public_read on public.blog_post_tags;
create policy blog_post_tags_public_read
on public.blog_post_tags
for select
using (true);

drop policy if exists blog_post_tags_editorial_insert on public.blog_post_tags;
create policy blog_post_tags_editorial_insert
on public.blog_post_tags
for insert
with check (public.is_editorial());

drop policy if exists blog_post_tags_editorial_delete on public.blog_post_tags;
create policy blog_post_tags_editorial_delete
on public.blog_post_tags
for delete
using (public.is_editorial());

-- Revisions are editorial-only.
drop policy if exists blog_revisions_editorial_select on public.blog_revisions;
create policy blog_revisions_editorial_select
on public.blog_revisions
for select
using (public.is_editorial());

drop policy if exists blog_revisions_editorial_insert on public.blog_revisions;
create policy blog_revisions_editorial_insert
on public.blog_revisions
for insert
with check (public.is_editorial());

drop policy if exists blog_revisions_editorial_update on public.blog_revisions;
create policy blog_revisions_editorial_update
on public.blog_revisions
for update
using (public.is_editorial())
with check (public.is_editorial());

drop policy if exists blog_revisions_editorial_delete on public.blog_revisions;
create policy blog_revisions_editorial_delete
on public.blog_revisions
for delete
using (public.is_editorial());

-- Consistent updated_at bookkeeping for taxonomy tables.
drop trigger if exists trg_blog_categories_set_updated_at on public.blog_categories;
create trigger trg_blog_categories_set_updated_at
before update on public.blog_categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_blog_tags_set_updated_at on public.blog_tags;
create trigger trg_blog_tags_set_updated_at
before update on public.blog_tags
for each row
execute function public.set_updated_at();
