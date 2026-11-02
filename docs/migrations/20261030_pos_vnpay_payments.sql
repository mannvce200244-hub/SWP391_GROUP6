BEGIN;
ALTER TABLE pos_momo_payments
    ADD COLUMN IF NOT EXISTS provider VARCHAR(16) NOT NULL DEFAULT 'MOMO',
    ADD COLUMN IF NOT EXISTS provider_create_date VARCHAR(14),
    ADD COLUMN IF NOT EXISTS refund_create_date VARCHAR(14);

ALTER TABLE pos_momo_payments
    DROP CONSTRAINT IF EXISTS ck_pos_momo_amount;

ALTER TABLE pos_momo_payments
    ADD CONSTRAINT ck_pos_momo_amount CHECK (
        amount = trunc(amount) AND (
            (provider = 'MOMO' AND amount >= 1000 AND amount <= 10000000)
            OR (provider = 'VNPAY' AND amount >= 5000 AND amount <= 9999999999 AND provider_create_date IS NOT NULL)
        )
    );
COMMIT;

