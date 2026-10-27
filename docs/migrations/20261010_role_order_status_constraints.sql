-- Existing enum checks must follow the approved five roles and online lifecycle.
-- Run with a migration owner before application startup. Normal startup performs
-- no DDL; the application database role does not need ALTER TABLE privileges.
BEGIN;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;
ALTER TABLE roles ADD CONSTRAINT roles_name_check
    CHECK (name IN ('CUSTOMER', 'ONLINE_STAFF', 'POS_STAFF', 'ADMIN', 'SUPER_ADMIN'));
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'OUT_OF_STOCK_WAITING',
        'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED'));
COMMIT;
