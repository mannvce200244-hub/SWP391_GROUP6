-- Apply before deploying the variant-enabled backend. Back up the database first.
-- Existing SKU identities, stock balances and transaction snapshots are preserved.
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_group varchar(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_label varchar(100);
-- A 200-character base name plus separator and 100-character variant label.
ALTER TABLE order_items ALTER COLUMN product_name TYPE varchar(303);
ALTER TABLE invoice_items ALTER COLUMN product_name TYPE varchar(303);
ALTER TABLE inventory_movements ALTER COLUMN product_name TYPE varchar(303);
ALTER TABLE stock_documents ALTER COLUMN product_name TYPE varchar(303);
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_variant_pair_check;
ALTER TABLE products ADD CONSTRAINT products_variant_pair_check CHECK (
    (variant_group IS NULL AND variant_label IS NULL) OR
    (variant_group IS NOT NULL AND variant_label IS NOT NULL
        AND length(trim(variant_group)) > 0 AND length(trim(variant_label)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS products_variant_group_label_uq
    ON products (lower(trim(variant_group)), lower(trim(variant_label)))
    WHERE variant_group IS NOT NULL;
COMMIT;
