-- Dedicated audit DB only. Every fixture is rolled back.
BEGIN;
DO $$
DECLARE category_id BIGINT; product_id BIGINT;
BEGIN
    INSERT INTO categories(code, name, created_at) VALUES ('PROD-AUDIT-ROLLBACK', 'Audit category', CURRENT_TIMESTAMP) RETURNING id INTO category_id;
    INSERT INTO products(code,name,price,created_at,is_active,category_id,low_stock_threshold,bulky_surcharge)
        VALUES ('PROD-AUDIT-ROLLBACK','Audit product',1000,CURRENT_TIMESTAMP,true,category_id,5,0)
        RETURNING id INTO product_id;
    BEGIN
        INSERT INTO inventories(product_id,quantity,updated_at) VALUES (product_id,-1,CURRENT_TIMESTAMP);
        RAISE EXCEPTION 'Negative inventory unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects negative inventory'; END;
    BEGIN
        INSERT INTO email_otp_challenges(id,email,purpose,sends,attempts,consumed)
            VALUES ('audit-invalid-purpose','audit@example.test','OTHER',0,0,false);
        RAISE EXCEPTION 'Invalid OTP purpose unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects invalid OTP purpose'; END;
    BEGIN
        INSERT INTO email_otp_challenges(id,email,purpose,sends,attempts,consumed)
            VALUES ('audit-invalid-counter','audit@example.test','REGISTER',-1,0,false);
        RAISE EXCEPTION 'Negative OTP counter unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects negative OTP counters'; END;
    BEGIN
        UPDATE shipping_settings SET rate_per_kg = -1 WHERE id = 1;
        RAISE EXCEPTION 'Negative shipping rate unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects negative shipping rate'; END;
    BEGIN
        UPDATE shipping_settings SET free_shipping_enabled = true, free_shipping_threshold = NULL WHERE id = 1;
        RAISE EXCEPTION 'Freeship without threshold unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects freeship without threshold'; END;
    BEGIN
        INSERT INTO product_promotions(product_id,name,discount_rate,is_active,version,created_at,updated_at)
            VALUES (product_id,'Invalid rate',1.1,true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
        RAISE EXCEPTION 'Promotion rate above 100 percent unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects promotion rate above 100 percent'; END;
    BEGIN
        INSERT INTO articles(title,content,type,status,version,created_at,updated_at,published_at)
            VALUES ('Audit publication','Audit content','ARTICLE','PUBLISHED',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL);
        RAISE EXCEPTION 'Publication without date unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: database rejects publication without date'; END;
END $$;
ROLLBACK;
