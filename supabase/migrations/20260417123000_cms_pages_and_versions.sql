-- CMS pages, redirects, and immutable version snapshots.

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  locale text not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  template text not null,
  meta_title text,
  meta_description text,
  canonical_url text,
  noindex boolean not null default false,
  publish_at timestamptz,
  unpublish_at timestamptz,
  views bigint not null default 0 check (views >= 0),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint cms_pages_locale_slug_key unique (locale, slug),
  constraint cms_pages_publish_window_check check (
    unpublish_at is null
    or publish_at is null
    or unpublish_at > publish_at
  )
);

create table if not exists public.cms_page_redirects (
  id bigserial primary key,
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  from_path text not null,
  to_path text not null,
  created_at timestamptz not null default now(),
  constraint cms_page_redirects_from_path_key unique (from_path),
  constraint cms_page_redirects_path_diff_check check (from_path <> to_path)
);

create table if not exists public.cms_page_versions (
  id bigserial primary key,
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  version integer not null check (version > 0),
  actor uuid references public.profiles(id) on delete set null,
  reason text,
  snapshot jsonb not null,
  captured_at timestamptz not null default now(),
  constraint cms_page_versions_page_id_version_key unique (page_id, version)
);

create or replace function public.cms_pages_validate_publish_seo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' then
    if nullif(trim(coalesce(new.meta_title, '')), '') is null then
      raise exception 'Cannot publish CMS page without meta_title';
    end if;

    if nullif(trim(coalesce(new.meta_description, '')), '') is null then
      raise exception 'Cannot publish CMS page without meta_description';
    end if;

    if nullif(trim(coalesce(new.canonical_url, '')), '') is null then
      raise exception 'Cannot publish CMS page without canonical_url';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cms_pages_validate_publish_seo on public.cms_pages;
create trigger trg_cms_pages_validate_publish_seo
before insert or update on public.cms_pages
for each row
execute function public.cms_pages_validate_publish_seo();

drop trigger if exists trg_cms_pages_set_updated_at on public.cms_pages;
create trigger trg_cms_pages_set_updated_at
before update on public.cms_pages
for each row
execute function public.set_updated_at();

create index if not exists cms_pages_status_locale_template_idx
  on public.cms_pages (status, locale, template);

create index if not exists cms_pages_updated_at_desc_idx
  on public.cms_pages (updated_at desc);

create index if not exists cms_page_versions_snapshot_gin_idx
  on public.cms_page_versions
  using gin (snapshot jsonb_path_ops);
