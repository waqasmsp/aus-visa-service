-- Ordered baseline migration 005: CMS pages and versions.

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  locale text not null,
  status text not null default 'draft',
  meta_title text,
  meta_description text,
  canonical_url text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (locale, slug)
);

create table if not exists public.cms_page_versions (
  id bigserial primary key,
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  version integer not null,
  actor uuid references public.profiles(id) on delete set null,
  snapshot jsonb not null,
  captured_at timestamptz not null default now(),
  unique (page_id, version)
);
