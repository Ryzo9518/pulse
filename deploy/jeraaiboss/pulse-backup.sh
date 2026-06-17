#!/usr/bin/env bash
# Encrypted backup of the Pulse Postgres (rootless podman container on jeraaiboss).
# Custom-format pg_dump (restorable with pg_restore) -> AES-256 encrypted -> rotated.
# Run by the pulse-backup.timer systemd user unit (daily). Idempotent + safe.
set -euo pipefail

BACKUP_DIR="${PULSE_BACKUP_DIR:-$HOME/pulse-db/backups}"
KEYFILE="${PULSE_BACKUP_KEY:-$HOME/pulse-db/.backup_key}"
CONTAINER="${PULSE_PG_CONTAINER:-pulse-postgres}"
DB="${PULSE_DB:-pulse}"
KEEP="${PULSE_KEEP_BACKUPS:-14}"            # how many most-recent encrypted backups to keep
OFFBOX_DEST="${PULSE_OFFBOX_DEST:-}"        # optional rsync target, e.g. user@host:/path (empty = local only)

mkdir -p "$BACKUP_DIR"
[ -f "$KEYFILE" ] || { echo "FATAL: backup key $KEYFILE missing"; exit 1; }

TS="$(date +%Y%m%d-%H%M%S)"
RAW="$BACKUP_DIR/pulse-$TS.dump"
ENC="$RAW.enc"

# 1) dump (custom format, compressed) from inside the container
podman exec "$CONTAINER" pg_dump -U postgres -d "$DB" -Fc > "$RAW"
# 2) encrypt at rest, then shred the plaintext
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$RAW" -out "$ENC" -pass "file:$KEYFILE"
rm -f "$RAW"
chmod 600 "$ENC"
echo "$(date -Is) backup ok: $ENC ($(du -h "$ENC" | cut -f1))"

# 3) off-box copy if configured (a backup on the same box is not a backup)
if [ -n "$OFFBOX_DEST" ]; then
  rsync -a "$ENC" "$OFFBOX_DEST"/ && echo "$(date -Is) off-box copy -> $OFFBOX_DEST"
else
  echo "$(date -Is) WARNING: PULSE_OFFBOX_DEST unset — backups are LOCAL ONLY (set an off-box target before real personal data)."
fi

# 4) rotation: keep the N most-recent encrypted backups
ls -1t "$BACKUP_DIR"/pulse-*.dump.enc 2>/dev/null | tail -n +"$((KEEP+1))" | xargs -r rm -f
