-- Upgrade the original M4N voucher/order/invoice schema before pricing snapshots.
-- Historical totals and discounts are preserved; old percentage vouchers remain MANUAL.
BEGIN;

ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS promotion_type VARCHAR(30);
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER;
UPDATE vouchers SET promotion_type = 'MANUAL' WHERE promotion_type IS NULL;
ALTER TABLE vouchers ALTER COLUMN promotion_type SET DEFAULT 'MANUAL';
ALTER TABLE vouchers ALTER COLUMN promotion_type SET NOT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS manual_discount_amount NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS automatic_discount_amount NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS automatic_promotion_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
UPDATE orders SET manual_discount_amount = discount_amount WHERE manual_discount_amount IS NULL;
UPDATE orders SET automatic_discount_amount = 0 WHERE automatic_discount_amount IS NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manual_discount_amount NUMERIC(14,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS automatic_discount_amount NUMERIC(14,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS automatic_promotion_code VARCHAR(50);
UPDATE invoices SET manual_discount_amount = discount WHERE manual_discount_amount IS NULL;
UPDATE invoices SET automatic_discount_amount = 0 WHERE automatic_discount_amount IS NULL;

COMMIT;

-- The original schema has no authoritative completion-event timestamp.
-- Leave historic completed_at NULL rather than inventing a completion date.
-- Existing reports use COALESCE(completed_at, updated_at, created_at) for old records;
-- new legitimate completion events populate completed_at in the backend.
-- The following pricing-snapshot script installs the enum check including SHIPPING.
