#!/usr/bin/env bash
# Verify the canonical schema + RLS against a throwaway local Postgres.
# Spins an ephemeral cluster (no Docker needed), applies the auth shim +
# migrations + fixtures, runs the RLS assertions, then tears everything down.
#   Usage: bash database/test/verify.sh
set -euo pipefail
export LC_ALL=C LC_CTYPE=C
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGDIR="$(mktemp -d -t pulse-verify-XXXXXX)"
PORT=55432
cleanup() { pg_ctl -D "$PGDIR/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$PGDIR"; }
trap cleanup EXIT

echo "▸ initdb (ephemeral cluster)"
initdb -D "$PGDIR/data" -U postgres --auth=trust --locale=C >/dev/null 2>&1
pg_ctl -D "$PGDIR/data" -o "-k $PGDIR -p $PORT -c listen_addresses=''" -l "$PGDIR/log" -w -t 30 start >/dev/null 2>&1
createdb -h "$PGDIR" -p "$PORT" -U postgres pulse
psql() { command psql -h "$PGDIR" -p "$PORT" -U postgres -d pulse -v ON_ERROR_STOP=1 -q "$@"; }

echo "▸ auth shim (local only)";        psql -f "$ROOT/database/test/000_auth_shim.sql"
echo "▸ 001_schema.sql";                psql -f "$ROOT/database/migrations/001_schema.sql"
echo "▸ 002_rls.sql";                   psql -f "$ROOT/database/migrations/002_rls.sql"
echo "▸ 003_seed.sql";                  psql -f "$ROOT/database/migrations/003_seed.sql"
echo "▸ 003_seed.sql (re-run = idempotent)"; psql -f "$ROOT/database/migrations/003_seed.sql"
echo "▸ 004_conformance.sql";           psql -f "$ROOT/database/migrations/004_conformance.sql"
echo "▸ 004_conformance.sql (re-run = idempotent)"; psql -f "$ROOT/database/migrations/004_conformance.sql"
echo "▸ test fixtures";                 psql -f "$ROOT/database/test/010_fixtures.sql"
echo "▸ RLS assertions";                psql -f "$ROOT/database/test/rls_tests.sql"
echo "✓ schema applied, seed idempotent, RLS verified"
