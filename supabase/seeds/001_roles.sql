-- Seed: roles
insert into public.roles (code, name)
values
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('user', 'User')
on conflict (code) do update
set name = excluded.name;
