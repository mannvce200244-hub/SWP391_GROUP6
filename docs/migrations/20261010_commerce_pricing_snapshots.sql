-- Approved pricing extension. Existing orders/invoices keep original values.
BEGIN;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS fixed_discount_amount NUMERIC(15,2);
-- Hibernate schema update does not reliably replace existing enum checks.
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_promotion_type_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_promotion_type_check
    CHECK (promotion_type IN ('MANUAL', 'AUTOMATIC_ORDER', 'SHIPPING'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_total_amount NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_discount_amount NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_shipping_fee NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_discount_amount NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(15,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_voucher_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS free_shipping_applied BOOLEAN;
UPDATE orders SET original_total_amount = total_amount WHERE original_total_amount IS NULL;
UPDATE orders SET product_discount_amount = 0 WHERE product_discount_amount IS NULL;
UPDATE orders SET base_shipping_fee = 0 WHERE base_shipping_fee IS NULL;
UPDATE orders SET shipping_discount_amount = 0 WHERE shipping_discount_amount IS NULL;
UPDATE orders SET shipping_fee = 0 WHERE shipping_fee IS NULL;
UPDATE orders SET free_shipping_applied = false WHERE free_shipping_applied IS NULL;

ALTER TABLE order_items ALTER COLUMN product_name TYPE VARCHAR(200);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_unit_price NUMERIC(14,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_promotion_id BIGINT;
UPDATE order_items SET original_unit_price = price WHERE original_unit_price IS NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS original_total_amount NUMERIC(14,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS product_discount_amount NUMERIC(14,2);
UPDATE invoices SET original_total_amount = subtotal WHERE original_total_amount IS NULL;
UPDATE invoices SET product_discount_amount = 0 WHERE product_discount_amount IS NULL;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS original_unit_price NUMERIC(14,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_promotion_id BIGINT;
UPDATE invoice_items SET original_unit_price = unit_price WHERE original_unit_price IS NULL;
COMMIT;
