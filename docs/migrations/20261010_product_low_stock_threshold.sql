-- Existing approved default: low-stock threshold is five units per Product.
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
UPDATE products SET low_stock_threshold = 5 WHERE low_stock_threshold IS NULL;
ALTER TABLE products ALTER COLUMN low_stock_threshold SET DEFAULT 5;
ALTER TABLE products ALTER COLUMN low_stock_threshold SET NOT NULL;
COMMIT;
