BEGIN;
CREATE TABLE IF NOT EXISTS pos_momo_payments (
    id VARCHAR(40) PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES users(id),
    bill TEXT NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    state VARCHAR(20) NOT NULL,
    refund_state VARCHAR(20) NOT NULL,
    payment_url VARCHAR(2000),
    transaction_no VARCHAR(32),
    refund_reference VARCHAR(40),
    refund_transaction_no VARCHAR(32),
    response_code VARCHAR(10),
    refund_response_code VARCHAR(10),
    failure_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invoice_id BIGINT UNIQUE REFERENCES invoices(id)
);
CREATE INDEX IF NOT EXISTS ix_pos_momo_staff_created ON pos_momo_payments(staff_id, created_at);
-- Also enforce invariants when Hibernate already created the development table.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'pos_momo_payments'::regclass AND conname = 'ck_pos_momo_amount') THEN
        ALTER TABLE pos_momo_payments ADD CONSTRAINT ck_pos_momo_amount CHECK (amount >= 1000 AND amount <= 10000000 AND amount = trunc(amount));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'pos_momo_payments'::regclass AND conname = 'ck_pos_momo_states') THEN
        ALTER TABLE pos_momo_payments ADD CONSTRAINT ck_pos_momo_states CHECK (
            state IN ('PENDING', 'SUCCEEDED', 'FAILED') AND refund_state IN ('NONE', 'PENDING', 'SUCCEEDED', 'FAILED')
            AND (refund_state = 'NONE' OR (state = 'SUCCEEDED' AND refund_reference IS NOT NULL))
            AND (invoice_id IS NULL OR (state = 'SUCCEEDED' AND refund_state = 'NONE')));
    END IF;
END $$;
COMMIT;
