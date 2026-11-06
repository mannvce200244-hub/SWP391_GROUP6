package com.m4n.backend.config;

import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.stream.Collectors;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class CatalogSeedIntegrationTest {
    @Autowired DataSeeder seeder;
    @Autowired ProductRepository products;
    @Autowired InventoryRepository inventories;

    @Test
    void catalogueHasTwelveDistinctCompleteInstrumentsAcrossAllThreeGroups() {
        var seeds = DataSeeder.catalogProducts();
        assertThat(seeds).hasSize(12);
        assertThat(Arrays.stream(seeds).map(DataSeeder.CatalogProduct::code).distinct().count()).isEqualTo(12);
        assertThat(Arrays.stream(seeds).collect(Collectors.groupingBy(DataSeeder.CatalogProduct::category, Collectors.counting())))
                .containsEntry("DAY", 4L).containsEntry("HOI", 4L).containsEntry("GO", 4L);
        for (var seed : seeds) {
            var product = products.findByCodeIgnoreCase(seed.code()).orElseThrow();
            assertThat(product.getName()).isNotBlank();
            assertThat(product.getDescription()).isNotBlank();
            assertThat(product.getMaterial()).isNotBlank();
            assertThat(product.getDimensions()).isNotBlank();
            assertThat(product.getMusicalRange()).isNotBlank();
            assertThat(seed.image()).endsWith(".jpg");
            assertThat(seed.alt()).startsWith("Ảnh minh họa");
            assertThat(new BigDecimal(seed.price())).isPositive();
            assertThat(new BigDecimal(seed.weightKg())).isPositive();
            assertThat(seed.stock()).isPositive();
        }
    }

    @Test
    void repeatedSeedingPreservesEditedPricesStockAndGallery() {
        var product = products.findByCodeIgnoreCase("TAM-001").orElseThrow();
        var inventory = inventories.findByProductId(product.getId()).orElseThrow();
        product.setPrice(new BigDecimal("3456789"));
        product.getMedia().getFirst().setUrl("/assets/images/merchant-photo.jpg");
        inventory.setQuantity(7);
        products.saveAndFlush(product);
        inventories.saveAndFlush(inventory);
        var count = products.count();
        seeder.run(new DefaultApplicationArguments());
        assertThat(products.count()).isEqualTo(count);
        assertThat(products.findByCodeIgnoreCase("TAM-001").orElseThrow().getPrice()).isEqualByComparingTo("3456789");
        assertThat(inventories.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(7);
        assertThat(product.getMedia().getFirst().getUrl()).isEqualTo("/assets/images/merchant-photo.jpg");
    }
}
