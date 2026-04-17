#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/policy_smoke_check.sql"

: "${DATABASE_URL:?DATABASE_URL must be set for policy smoke checks}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"

echo "Policy smoke checks passed for anon/authenticated/service_role contexts."
