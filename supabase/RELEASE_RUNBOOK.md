# Supabase release sequence and rollback strategy

## Release sequence

1. **Backup snapshot**
   - Create a managed Postgres snapshot/backup before any schema change.
   - Record snapshot ID in the release ticket.

2. **Apply migrations**
   - Apply ordered migration set (`001` through `013`) in staging, then production.
   - Use the same migration artifact that passed CI.

3. **Run post-migration verification SQL**
   - Execute smoke checks for required tables/indexes, seed existence, and RLS policy compile checks.
   - Run `supabase/scripts/policy_smoke_check.sh` against the target environment.

4. **Enable app traffic**
   - Re-enable write traffic after verification SQL passes.
   - Monitor DB errors, lock contention, and webhook/payment failure rates for 30 minutes.

## Rollback strategy

1. **Preferred: forward-fix migration**
   - For non-catastrophic defects, ship a compensating migration preserving history and avoiding destructive rollbacks.
   - Keep migration chain monotonic to avoid environment divergence.

2. **Emergency: restore from snapshot**
   - For severe incidents (data corruption, unrecoverable lock/event storms), pause app traffic.
   - Restore the pre-release snapshot.
   - Reconcile events created after snapshot restore from durable logs/webhooks where possible.
