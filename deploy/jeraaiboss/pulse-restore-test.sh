#!/usr/bin/env bash
# Prove the latest encrypted backup actually RESTORES (a backup you haven't
# restored is a hope, not a backup). Decrypts the latest backup, restores it into
# a throwaway scratch database, checks the table/row counts, then drops the
# scratch DB. Never touches the live `pulse` database.
set -euo pipefail

BACKUP_DIR="${PULSE_BACKUP_DIR:-$HOME/pulse-db/backups}"
KEYFILE="${PULSE_BACKUP_KEY:-$HOME/pulse-db/.backup_key}"
CONTAINER="${PULSE_PG_CONTAINER:-pulse-postgres}"

LATEST="$(ls -1t "$BACKUP_DIR"/pulse-*.dump.enc 2>/dev/null | head -1 || true)"
[ -n "$LATEST" ] || { echo "FATAL: no backup found in $BACKUP_DIR"; exit 1; }
echo "restore-test using: $LATEST"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -in "$LATEST" -out "$TMP" -pass "file:$KEYFILE"

SCRATCH="pulse_restore_test_$(date +%s)"
podman exec "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "drop database if exists $SCRATCH;" -c "create database $SCRATCH;" >/dev/null
podman exec -i "$CONTAINER" pg_restore -U postgres -d "$SCRATCH" --no-owner < "$TMP" 2>/dev/null || true

q() { podman exec "$CONTAINER" psql -U postgres -d "$SCRATCH" -tAc "$1" | tr -d '[:space:]'; }
T="$(q "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';")"
P="$(q "select count(*) from hr_policies;")"
E="$(q "select count(*) from employees;")"
podman exec "$CONTAINER" psql -U postgres -d postgres -c "drop database $SCRATCH;" >/dev/null

echo "restored scratch DB: tables=$T policies=$P employees=$E"
if [ "${T:-0}" -ge 33 ] && [ "${P:-0}" -eq 24 ] && [ "${E:-0}" -eq 14 ]; then
  echo "✓ RESTORE TEST PASSED"
else
  echo "✗ RESTORE TEST FAILED (expected tables>=33, policies=24, employees=14)"; exit 1
fi
