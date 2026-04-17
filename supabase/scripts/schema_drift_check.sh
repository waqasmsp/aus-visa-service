#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_SNAPSHOT="$ROOT_DIR/schema/schema.snapshot.sql"
ACTUAL_SCHEMA="$(mktemp)"

: "${DATABASE_URL:?DATABASE_URL must be set for schema drift checks}"

mkdir -p "$ROOT_DIR/schema"

pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL" > "$ACTUAL_SCHEMA"

if [[ ! -f "$SCHEMA_SNAPSHOT" ]]; then
  cp "$ACTUAL_SCHEMA" "$SCHEMA_SNAPSHOT"
  echo "Initialized schema snapshot at $SCHEMA_SNAPSHOT"
  exit 0
fi

if ! diff -u "$SCHEMA_SNAPSHOT" "$ACTUAL_SCHEMA"; then
  echo "Schema drift detected against $SCHEMA_SNAPSHOT" >&2
  exit 1
fi

echo "Schema drift check passed."
