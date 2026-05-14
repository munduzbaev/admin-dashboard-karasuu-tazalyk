-- =============================================================
-- Tazalyk Kara-Suu: audit-cleanup migration
-- Run in Supabase SQL Editor as a single transaction.
-- Idempotent — safe to re-run.
-- =============================================================

BEGIN;

-- ── 1. Refusal workflow fields on applications ───────────────

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS refusal_notes           TEXT,
    ADD COLUMN IF NOT EXISTS refused_at              TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS refusal_signature_url   TEXT,
    ADD COLUMN IF NOT EXISTS refused_lat             NUMERIC,
    ADD COLUMN IF NOT EXISTS refused_lng             NUMERIC,
    ADD COLUMN IF NOT EXISTS refused_by_operator_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS refusal_approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS refusal_approved_at     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_applications_status_pending_approval
    ON applications(status)
    WHERE status = 'pending_admin_approval';

-- ── 2. Schedule completion tracking ──────────────────────────

ALTER TABLE schedules
    ADD COLUMN IF NOT EXISTS last_completed TIMESTAMPTZ;

-- ── 3. Transport: Telegram chat link for drivers ─────────────

ALTER TABLE transport
    ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

CREATE INDEX IF NOT EXISTS idx_transport_telegram
    ON transport(telegram_chat_id)
    WHERE telegram_chat_id IS NOT NULL;

-- ── 4. Users: phone field for staff ──────────────────────────

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 5. Migrate any legacy senior_operator role to operator ───

UPDATE users SET role = 'operator' WHERE role = 'senior_operator';

-- ── 6. Storage bucket for refusal signatures ─────────────────
-- Run separately in Supabase Dashboard → Storage if INSERT below
-- fails due to permissions. The bucket must be public-read so
-- signatures load in admin without signed URLs.

INSERT INTO storage.buckets (id, name, public)
VALUES ('refusal-signatures', 'refusal-signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket. Insert-only for authenticated
-- (the mini-app will use anon key + service-role on the API side
-- if needed). Read open for everyone since URL itself is unguessable.
DO $$
BEGIN
    -- Allow public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
          AND schemaname = 'storage'
          AND policyname = 'refusal_signatures_public_read'
    ) THEN
        CREATE POLICY refusal_signatures_public_read ON storage.objects
            FOR SELECT
            USING (bucket_id = 'refusal-signatures');
    END IF;

    -- Allow inserts (service role bypasses RLS, so this is for anon mini-app uploads)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
          AND schemaname = 'storage'
          AND policyname = 'refusal_signatures_insert'
    ) THEN
        CREATE POLICY refusal_signatures_insert ON storage.objects
            FOR INSERT
            WITH CHECK (bucket_id = 'refusal-signatures');
    END IF;
END $$;

COMMIT;

-- =============================================================
-- Verification queries (run after the migration to sanity-check)
-- =============================================================

-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'applications' AND column_name LIKE 'refus%';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'schedules' AND column_name = 'last_completed';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'transport' AND column_name = 'telegram_chat_id';
-- SELECT id, public FROM storage.buckets WHERE id = 'refusal-signatures';
