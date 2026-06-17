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

## Off-box copies — DONE (Hetzner, 2026-06-17) ✅
Encrypted backups rsync to the Hetzner box `jera-toolkit` (159.69.216.113) at
`/var/backups/pulse`, via the `hetzner-backup` ssh alias in `~/.ssh/config` (uses
the existing `~/.ssh/hetzner_migrate` key, root). Wired through
`~/pulse-db/backup.env` (`PULSE_OFFBOX_DEST=hetzner-backup:/var/backups/pulse`),
which the systemd service loads. Verified: manual + scheduled runs both land on
Hetzner. (Off-box retention on Hetzner is not yet rotated — add a prune cron there
if needed.)

## ⚠️ Still to action before real personal data (POPIA)
- **The backup key** (`~/pulse-db/.backup_key`) must be stored **off both boxes**
  (password manager / secret store). The encrypted backups now live on Hetzner,
  but if jeraaiboss is lost the key goes with it and the Hetzner copies become
  unrecoverable. Ryan: grab `~/pulse-db/.backup_key` from jeraaiboss and stash it
  in a password manager. Do NOT also copy it to Hetzner (that would defeat the
  encryption).
