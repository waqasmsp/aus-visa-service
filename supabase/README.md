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

## Ordered migration baseline

In addition to timestamp migrations, this repo now carries an explicit ordered release set:

1. `001_extensions.sql`
2. `002_core_profiles_roles.sql`
3. `003_applications.sql`
4. `004_chats.sql`
5. `005_cms_pages.sql`
6. `006_blogs.sql`
7. `007_billing.sql`
8. `008_payments.sql`
9. `009_webhooks.sql`
10. `010_settings_audit.sql`
11. `011_rls_policies.sql`
12. `012_indexes_perf.sql`
13. `013_seed_reference_data.sql`

## Seed scripts

Reference seed scripts live in `supabase/seeds/`:

- `001_roles.sql`
- `002_default_settings.sql`
- `003_plan_catalog.sql`
- `004_test_safe_coupons.sql`

## CI guardrails

Database CI checks are defined in `.github/workflows/supabase-db-guardrails.yml` and run:

- migration lint (`supabase/scripts/migration_lint.sh`)
- schema drift detection (`supabase/scripts/schema_drift_check.sh`)
- RLS policy smoke checks for anon/authenticated/service roles (`supabase/scripts/policy_smoke_check.sh`)

## Release + rollback

Use `supabase/RELEASE_RUNBOOK.md` for:

- backup snapshot
- apply migrations
- post-migration verification SQL
- app-traffic enablement
- forward-fix-first rollback strategy with emergency snapshot restore path
