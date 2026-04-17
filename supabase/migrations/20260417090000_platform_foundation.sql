-- Platform foundation: schemas, extensions, global conventions, reusable trigger helpers.

-- Core schemas
create schema if not exists public;
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists audit;

-- Required extensions (idempotent)
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;
create extension if not exists btree_gin;

-- Reusable updated_at trigger function for mutable tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
