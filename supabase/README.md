# Supabase Environment & Migration Baseline

This repository now includes a migration-first Supabase foundation with three explicit environments:

- `local`
- `staging`
- `production`

Each environment must map to its own:

1. Supabase project (unique project ref)
2. Postgres instance / connection string
3. Managed secrets (`SUPABASE_ACCESS_TOKEN`, service-role keys, webhook secrets, etc.)

## Environment files

Use the templates in `supabase/environments/` and keep real values out of git.

- `local.env.example`
- `staging.env.example`
- `production.env.example`

## Migration strategy

All schema changes live in `supabase/migrations/` as timestamped SQL files.

Bounded context split:

1. platform foundation (schemas, extensions, helper functions)
2. users
3. applications
4. chats
5. billing
6. payments
7. cms/blog
8. settings
9. audit
10. rls
11. seeds

The SQL files are idempotent where practical (`IF NOT EXISTS`, guarded DDL, and `DO` blocks).
