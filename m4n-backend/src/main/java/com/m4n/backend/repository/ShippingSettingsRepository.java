package com.m4n.backend.repository;

import com.m4n.backend.entity.ShippingSettings;
import org.springframework.data.jpa.repository.*;

public interface ShippingSettingsRepository extends JpaRepository<ShippingSettings, Long> {
    // PostgreSQL's atomic insert-if-absent protects singleton initialization by concurrent first requests.
    @Modifying
    @Query(value = "INSERT INTO shipping_settings (id, enabled, rate_per_kg, free_shipping_enabled, free_shipping_threshold, version, updated_at) "
            + "VALUES (1, FALSE, 0, FALSE, NULL, 0, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING", nativeQuery = true)
    void ensureDefaultSettings();
}
