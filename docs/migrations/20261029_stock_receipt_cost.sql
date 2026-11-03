BEGIN;
ALTER TABLE stock_documents ADD COLUMN IF NOT EXISTS unit_cost numeric(19,2);
ALTER TABLE stock_documents DROP CONSTRAINT IF EXISTS ck_stock_document_unit_cost;
ALTER TABLE stock_documents ADD CONSTRAINT ck_stock_document_unit_cost
    CHECK (unit_cost IS NULL OR (type = 'RECEIPT' AND unit_cost >= 0
        AND unit_cost <= 9999999999 AND unit_cost = trunc(unit_cost)));
-- Historical documents retain NULL: their purchase costs were not recorded.
COMMIT;
