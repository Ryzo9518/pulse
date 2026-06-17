# jeraaiboss — Pulse deployment (ops)

Operational scripts/units for the self-hosted Pulse Postgres on `jeraaiboss`
(154.70.249.26). The DB runs as a **rootless podman** container `pulse-postgres`
(PostgreSQL 16, `127.0.0.1:5432` only, persistent volume `pulse_pgdata`,
`--restart=always`, user lingering enabled). See `database/README.md` for the
migration apply order.

## Backups (B0.5)

| File | Purpose |
|---|---|
| `pulse-backup.sh` | encrypted (`AES-256`, `openssl`) custom-format `pg_dump`, rotated |
| `pulse-restore-test.sh` | decrypt latest → restore into a scratch DB → verify counts → drop |
| `pulse-backup.{service,timer}` | systemd **user** units — daily backup at 02:00 |
| `pulse-restore-test.{service,timer}` | systemd **user** units — weekly restore verification (Sun 03:00) |

### Install (on the box, as `rkock`)
```bash
# scripts
mkdir -p ~/pulse-db ~/.config/systemd/user
cp pulse-backup.sh pulse-restore-test.sh ~/pulse-db/ && chmod 700 ~/pulse-db/*.sh
# backup encryption key (generate once, store a copy OFF the box)
test -f ~/pulse-db/.backup_key || openssl rand -base64 48 > ~/pulse-db/.backup_key
chmod 600 ~/pulse-db/.backup_key
# timers
cp pulse-backup.{service,timer} pulse-restore-test.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now pulse-backup.timer pulse-restore-test.timer
```
Lingering (`loginctl enable-linger rkock`) is already on, so user timers run
without an active login.

### Environment knobs (optional, set in the service or shell)
- `PULSE_OFFBOX_DEST` — rsync target (e.g. `user@host:/backups/pulse`) for an
  **off-box** copy. **Until this is set, backups are LOCAL ONLY** — a box failure
  loses them. Set a real off-box destination before real personal data lands.
- `PULSE_KEEP_BACKUPS` — how many encrypted backups to retain (default 14).

### Restore (real)
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -in <pulse-YYYYMMDD-HHMMSS.dump.enc> \
  -out /tmp/pulse.dump -pass file:$HOME/pulse-db/.backup_key
podman exec -i pulse-postgres pg_restore -U postgres -d pulse --clean --if-exists --no-owner < /tmp/pulse.dump
rm -f /tmp/pulse.dump
```

## ⚠️ Two things to action before real personal data (POPIA)
1. **Off-box copies** — set `PULSE_OFFBOX_DEST` (a second machine / NAS / object
   store). Confirm the destination with Ryan.
2. **The backup key** (`~/pulse-db/.backup_key`) must be stored **off the box**
   too — a backup encrypted with a key that only lives next to it is not
   recoverable if the box is lost. Keep a copy in a password manager / secret store.
