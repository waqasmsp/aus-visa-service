-- Ordered baseline migration 013: load reference seed data.

-- Note: keep these includes as plain SQL statements for tools that concatenate
-- migration files. For psql, run with \i commands manually if needed.
insert into public.roles (code, name)
values
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('user', 'User')
on conflict (code) do update
set name = excluded.name;
