-- ============================================================================
-- Certification Registry — Phase A migration
-- Plan: docs/plans/2026-06-14-001-feat-certification-registry-plan.md (Unit 2)
-- Adds the certifications registry + an append-only audit log, mirroring the
-- conventions in database/pulse_v5_schema.sql (UUID PKs, TIMESTAMPTZ defaults,
-- RLS via is_admin() and `employee_id = auth.uid() OR is_admin()`).
--
-- NOT YET APPLIED — review before running against Supabase. Requires the
-- service-role write path (see frontend/lib/supabase-admin.ts) for the daily
-- sweep and admin-verify writes.
-- ============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE certification_family    AS ENUM ('sage', 'professional', 'vendor');
CREATE TYPE certification_lifecycle AS ENUM ('renewable', 'one_time');
CREATE TYPE certification_status    AS ENUM ('pending_verification', 'active', 'expiring_soon', 'expired');
CREATE TYPE certification_event_type AS ENUM (
    'created',          -- upload or training-completion created the entry
    'verified',         -- admin confirmed the credential + its dates
    'rejected',         -- admin rejected the upload (returns to the consultant)
    'status_changed',   -- the daily sweep recomputed status
    're_uploaded',      -- holder replaced the proof after renewal
    'reminder_sent'     -- a renewal reminder was dispatched (idempotency anchor)
);

-- ── Registry table ───────────────────────────────────────────────────────────
CREATE TABLE certifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    family              certification_family NOT NULL,
    lifecycle_kind      certification_lifecycle NOT NULL DEFAULT 'renewable',
    name                TEXT NOT NULL,                 -- e.g. "Sage Intacct Implementation Specialist"
    issuing_body        TEXT,                          -- e.g. "Sage", "ACCA"
    issued_date         DATE,
    expiry_date         DATE,                          -- null when non_expiring
    renew_by_date       DATE,                          -- action-start date; derived from expiry if null (R23)
    non_expiring        BOOLEAN NOT NULL DEFAULT FALSE,
    status              certification_status NOT NULL DEFAULT 'pending_verification',
    proof_path          TEXT,                          -- path in the private 'certifications' storage bucket
    -- Import baseline (R22): the sweep only fires for renew-by points crossed
    -- AFTER this timestamp, so bulk-loading historical certs never storms.
    reminders_baseline_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Provenance of the active state: 'admin' (manual verify) or 'system/training-completion'.
    verified_by         UUID REFERENCES employees(id),
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certifications_employee ON certifications(employee_id);
CREATE INDEX idx_certifications_status   ON certifications(status);
-- Sweep query support: renewable certs ordered by renew-by.
CREATE INDEX idx_certifications_renewal  ON certifications(lifecycle_kind, renew_by_date)
    WHERE lifecycle_kind = 'renewable';

-- ── Append-only audit log (R3: tamper-evident provenance) ────────────────────
CREATE TABLE certification_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certification_id    UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    event_type          certification_event_type NOT NULL,
    actor_id            UUID REFERENCES employees(id),  -- null for system/sweep events
    detail              JSONB,                          -- e.g. { "old_status": "...", "new_status": "..." }
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cert_events_cert ON certification_events(certification_id);
CREATE INDEX idx_cert_events_type ON certification_events(certification_id, event_type);

-- Hard append-only enforcement: block UPDATE/DELETE even for the service role,
-- so the audit trail is genuinely tamper-evident, not just RLS-gated.
CREATE OR REPLACE FUNCTION certification_events_block_mutations()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'certification_events is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cert_events_no_update
    BEFORE UPDATE OR DELETE ON certification_events
    FOR EACH ROW EXECUTE FUNCTION certification_events_block_mutations();

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE certifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_events  ENABLE ROW LEVEL SECURITY;

-- Certifications: a consultant sees only their own; admins see all (R18).
CREATE POLICY "cert_sel" ON certifications FOR SELECT
    USING (employee_id = auth.uid() OR is_admin());
-- A consultant can upload (insert) their own; admins can insert for anyone.
CREATE POLICY "cert_ins" ON certifications FOR INSERT
    WITH CHECK (employee_id = auth.uid() OR is_admin());
-- Verification and status changes are admin-only via the client; the daily
-- sweep uses the service-role key, which bypasses RLS by design (R5, R7).
CREATE POLICY "cert_upd" ON certifications FOR UPDATE
    USING (is_admin());

-- Events: readable by the cert's owner or an admin; insert by owner/admin.
-- No UPDATE/DELETE policy exists, and the trigger above blocks them outright.
CREATE POLICY "cert_evt_sel" ON certification_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM certifications c
            WHERE c.id = certification_id
              AND (c.employee_id = auth.uid() OR is_admin())
        )
    );
CREATE POLICY "cert_evt_ins" ON certification_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM certifications c
            WHERE c.id = certification_id
              AND (c.employee_id = auth.uid() OR is_admin())
        )
    );

-- ── Storage (manual step, mirrors schema §21) ────────────────────────────────
-- Create a PRIVATE bucket named 'certifications' in the Supabase dashboard
-- (Public = OFF). Proof files are reachable only via short-lived signed URLs.
-- Suggested storage.objects policies (apply after the bucket exists):
--   SELECT/INSERT allowed when bucket_id = 'certifications' AND the object's
--   first path segment = auth.uid()::text (own files) OR is_admin().
-- ============================================================================
