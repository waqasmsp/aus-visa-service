#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/migrations"

required=(
  001_extensions.sql
  002_core_profiles_roles.sql
  003_applications.sql
  004_chats.sql
  005_cms_pages.sql
  006_blogs.sql
  007_billing.sql
  008_payments.sql
  009_webhooks.sql
  010_settings_audit.sql
  011_rls_policies.sql
  012_indexes_perf.sql
  013_seed_reference_data.sql
)

for file in "${required[@]}"; do
  if [[ ! -f "$MIGRATIONS_DIR/$file" ]]; then
    echo "Missing required migration: $file" >&2
    exit 1
  fi

done

for sql in "$MIGRATIONS_DIR"/*.sql; do
  if [[ ! -s "$sql" ]]; then
    echo "Migration file is empty: $sql" >&2
    exit 1
  fi

  if ! rg -q ';\s*$' "$sql"; then
    echo "Migration appears to have no SQL statement terminator: $sql" >&2
    exit 1
  fi

done

echo "Migration lint passed."
