BEGIN;
ALTER TABLE pos_momo_payments ADD COLUMN IF NOT EXISTS receipt_email_queued_at TIMESTAMPTZ;
ALTER TABLE pos_momo_payments ADD COLUMN IF NOT EXISTS receipt_email_attempted_at TIMESTAMPTZ;
ALTER TABLE pos_momo_payments ADD COLUMN IF NOT EXISTS receipt_email_sent_at TIMESTAMPTZ;
-- Historical invoices are not backfilled: do not send unsolicited old receipts.
CREATE INDEX IF NOT EXISTS ix_pos_receipt_email_pending
    ON pos_momo_payments (receipt_email_queued_at, id)
    WHERE receipt_email_queued_at IS NOT NULL AND receipt_email_sent_at IS NULL;
COMMIT;
