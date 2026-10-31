-- Restore already-approved checks when Hibernate created a table before its upgrade script.
-- CREATE TABLE IF NOT EXISTS does not install checks on a pre-existing table.
-- Violating historical rows abort the transaction; no values are silently repaired.
BEGIN;
DO $$
DECLARE rule RECORD;
BEGIN
    FOR rule IN SELECT * FROM (VALUES
        ('articles', 'ck_article_version', 'version >= 0'),
        ('articles', 'ck_article_title', 'length(btrim(title)) BETWEEN 1 AND 200'),
        ('articles', 'ck_article_content', 'length(btrim(content)) BETWEEN 1 AND 30000'),
        ('articles', 'ck_article_publication', '(status = ''PUBLISHED'' AND published_at IS NOT NULL) OR (status = ''DRAFT'' AND published_at IS NULL)'),
        ('product_promotions', 'ck_product_promotion_rate', 'discount_rate >= 0 AND discount_rate <= 1'),
        ('product_promotions', 'ck_product_promotion_period', 'valid_from IS NULL OR valid_until IS NULL OR valid_until > valid_from'),
        ('shipping_settings', 'ck_shipping_singleton', 'id = 1'),
        ('shipping_settings', 'ck_shipping_rate', 'rate_per_kg >= 0'),
        ('shipping_settings', 'ck_shipping_threshold', 'free_shipping_threshold >= 0 AND free_shipping_threshold = trunc(free_shipping_threshold)'),
        ('shipping_settings', 'ck_shipping_freeship', 'NOT free_shipping_enabled OR free_shipping_threshold IS NOT NULL'),
        ('email_otp_challenges', 'ck_email_otp_purpose', 'purpose IN (''REGISTER'', ''RESET_PASSWORD'')'),
        ('email_otp_challenges', 'ck_email_otp_counters', 'sends >= 0 AND attempts >= 0')
    ) AS checks(table_name, constraint_name, expression)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = rule.constraint_name
                AND conrelid = to_regclass(rule.table_name)) THEN
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
                rule.table_name, rule.constraint_name, rule.expression);
        END IF;
        EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', rule.table_name, rule.constraint_name);
    END LOOP;
END $$;
COMMIT;
