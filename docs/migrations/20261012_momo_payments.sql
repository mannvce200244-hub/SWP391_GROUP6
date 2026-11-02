BEGIN;
ALTER TABLE payment_attempts ADD COLUMN IF NOT EXISTS payment_url VARCHAR(2000);
ALTER TABLE payment_attempts ALTER COLUMN transaction_no TYPE VARCHAR(32);
ALTER TABLE payment_attempts ALTER COLUMN response_code TYPE VARCHAR(10);
ALTER TABLE payment_attempts ALTER COLUMN refund_transaction_no TYPE VARCHAR(32);
ALTER TABLE payment_attempts ALTER COLUMN refund_response_code TYPE VARCHAR(10);
COMMIT;
