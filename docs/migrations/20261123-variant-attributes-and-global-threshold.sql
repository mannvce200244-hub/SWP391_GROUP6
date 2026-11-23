BEGIN;

-- Multi-attribute variant classification (up to 2 option dimensions per ProductFamily)
ALTER TABLE product_families ADD COLUMN IF NOT EXISTS option1_name varchar(50);
ALTER TABLE product_families ADD COLUMN IF NOT EXISTS option2_name varchar(50);

ALTER TABLE product_families DROP CONSTRAINT IF EXISTS product_families_option_names_check;
ALTER TABLE product_families ADD CONSTRAINT product_families_option_names_check CHECK (
    (option1_name IS NULL OR length(btrim(option1_name)) > 0)
    AND (option2_name IS NULL OR (option1_name IS NOT NULL AND length(btrim(option2_name)) > 0))
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS option1_value varchar(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS option2_value varchar(50);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_option_values_check;
ALTER TABLE products ADD CONSTRAINT products_option_values_check CHECK (
    (option1_value IS NULL OR length(btrim(option1_value)) > 0)
    AND (option2_value IS NULL OR (option1_value IS NOT NULL AND length(btrim(option2_value)) > 0))
);

-- Unify global low-stock alert threshold to 5 across all products (column retained for compatibility)
UPDATE products SET low_stock_threshold = 5 WHERE low_stock_threshold IS DISTINCT FROM 5;
ALTER TABLE products ALTER COLUMN low_stock_threshold SET DEFAULT 5;

COMMIT;
