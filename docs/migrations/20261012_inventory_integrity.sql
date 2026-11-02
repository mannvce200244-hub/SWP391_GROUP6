-- Enforce the existing BR-INVENTORY-03 invariant at the persistence boundary.
-- Invalid historical rows stop this migration; do not invent stock corrections.
BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
            WHERE conname = 'ck_inventory_nonnegative' AND conrelid = 'inventories'::regclass) THEN
        ALTER TABLE inventories ADD CONSTRAINT ck_inventory_nonnegative CHECK (quantity >= 0) NOT VALID;
    END IF;
END $$;
ALTER TABLE inventories VALIDATE CONSTRAINT ck_inventory_nonnegative;
COMMIT;
