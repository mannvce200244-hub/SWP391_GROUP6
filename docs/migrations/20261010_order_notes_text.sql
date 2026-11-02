-- Approved audit repair: retain customer notes and subsequent order events.
-- PostgreSQL; execute against the configured application schema before testing
-- or deploying this repair. The conversion preserves existing notes and can
-- be repeated safely. Hibernate ddl-auto=update does not reliably widen the
-- existing varchar(500) column to text.
BEGIN;
ALTER TABLE orders ALTER COLUMN notes TYPE text;
COMMIT;
