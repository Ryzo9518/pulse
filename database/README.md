# Pulse database (backend phase)

Canonical schema, RLS, and seed for the Pulse backend phase (plan:
`docs/plans/2026-06-15-002-feat-pulse-backend-phase-plan.md`). This is the single
source of truth — it matches `frontend/types/database.ts` (the app's typed
contract) and supersedes the stale `archive/pulse_v5_schema.sql`.

## Layout

```
database/
  migrations/
    001_schema.sql   tables, enums, constraints, indexes, triggers, views (matches the type contract)
    002_rls.sql      Row-Level Security — the real authorization boundary (capability matrix + owner)
    003_seed.sql     reference data + the Jera org (idempotent; safe to re-run)
  test/
    000_auth_shim.sql  LOCAL-ONLY auth.uid() shim (Supabase provides the real one)
    010_fixtures.sql   test-only data for the RLS assertions
    rls_tests.sql      per-role positive + negative RLS assertions
    verify.sh          spins an ephemeral Postgres, applies everything, runs the tests
  archive/           superseded pre-backend SQL (kept for reference, not applied)
```

## Verify (no Docker needed — uses local Postgres tools)

```bash
bash database/test/verify.sh
```

Spins a throwaway cluster, applies the auth shim → migrations → seed (twice, to
prove idempotency) → fixtures → RLS assertions, then tears it down. A failed
expectation aborts with a `RLS FAIL [...]` message. Verified passing 2026-06-15.

## Apply order in production (B0)

1. `000_prod_auth.sql` (the real Supabase `auth.uid()` reading the JWT claim —
   NOT the `test/` shim) → `001_schema.sql` → `002_rls.sql` → `003_seed.sql` →
   `004_conformance.sql`.
2. Regenerate `frontend/types/database.ts` from the live DB and confirm parity.

### Deployed (B0) — jeraaiboss, 2026-06-17 ✅
Live on `jeraaiboss` (154.70.249.26) as a **rootless podman** container
`pulse-postgres` (PostgreSQL 16.14), bound to **127.0.0.1:5432 only** (not
internet-exposed), persistent volume `pulse_pgdata`, `--restart=always`, user
lingering enabled (survives logout/reboot). Superuser password at
`~/pulse-db/.pg_superpass` (0600). Applied `000_prod_auth → 001 → 002 → 003 → 004`
and verified: 33 tables, 73 RLS policies, 24 policies, 14 employees, owner =
ryan@jera.co.za, 0 tables without RLS; `auth.uid()` resolves a real signed-in
user via the JWT claim.

**Not yet (next, B0.5/B1/B2):** encrypted off-box backups + tested restore
BEFORE any real personal data; the Supabase API/auth layer (PostgREST + GoTrue +
M365 Entra — needs the M365 client secret) so the app can connect; null/relink
the seeded placeholder `auth_user_id` values at first real M365 login.

## Security model (see 002_rls.sql)

- **Default-deny** — RLS enabled on every table; no matching policy ⇒ no rows.
- Roles **employee / manager / admin** + the **owner** super-admin flag.
- **Manager** = work-related team oversight only — never payroll/POPIA/personal
  data or the contract / HR-admin onboarding tasks (verified by the RLS tests).
- **Owner** is unrestricted and protected: only an owner may change roles or
  owner status, and an owner can't be demoted/deleted by a non-owner (trigger).
- `auth.uid()`-based identity (Supabase native Entra provider — see plan §Identity).

## Notes / follow-ups (tracked in the plan)

- POPIA fields (`id_number`, bank account, medical) need column-level encryption
  at rest in B0.5 — flagged in `001_schema.sql`.
- `employees.phone` is the one borderline column not row-hideable from managers;
  mitigated at the app projection today, masked-view/column-move planned in B0.5.
- Full 24-policy bodies + SOP steps are imported at B6 (Word→HTML); `003_seed.sql`
  carries metadata stubs.
