-- Approved VNPay sandbox integration. Apply before deploying its entity/service.
BEGIN;
CREATE TABLE IF NOT EXISTS payment_attempts (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(14,2) NOT NULL,
    provider_create_date VARCHAR(14) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    state VARCHAR(20) NOT NULL CHECK (state IN ('PENDING','SUCCEEDED','FAILED')),
    transaction_no VARCHAR(15), bank_code VARCHAR(20), pay_date VARCHAR(14), response_code VARCHAR(2),
    refund_state VARCHAR(20) NOT NULL CHECK (refund_state IN ('NONE','PENDING','SUCCEEDED','FAILED')),
    refund_request_id VARCHAR(32), refund_create_date VARCHAR(14), refund_reason VARCHAR(500),
    refund_create_by VARCHAR(245), refund_response_id VARCHAR(32), refund_transaction_no VARCHAR(15),
    refund_response_code VARCHAR(2)
);
CREATE INDEX IF NOT EXISTS ix_payment_attempt_order ON payment_attempts(order_id,id);
COMMIT;
