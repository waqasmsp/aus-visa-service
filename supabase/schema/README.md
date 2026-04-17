# Schema snapshots

`schema.snapshot.sql` is used by CI schema drift detection.

Update procedure:

1. Apply migrations to the target environment.
2. Dump schema via `pg_dump --schema-only --no-owner --no-privileges`.
3. Replace `schema.snapshot.sql` when schema changes are intentional.
