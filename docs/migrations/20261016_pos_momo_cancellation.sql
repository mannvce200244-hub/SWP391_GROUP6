BEGIN;
ALTER TABLE pos_momo_payments
    ADD COLUMN IF NOT EXISTS cancel_requested BOOLEAN NOT NULL DEFAULT FALSE;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'pos_momo_payments'::regclass AND conname = 'ck_pos_momo_cancellation') THEN
        ALTER TABLE pos_momo_payments ADD CONSTRAINT ck_pos_momo_cancellation
            CHECK (NOT cancel_requested OR invoice_id IS NULL);
    END IF;
END $$;
COMMIT;
