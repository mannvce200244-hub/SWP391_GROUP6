package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.ProductPromotionResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Product;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.ProductRepository;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @Transactional
class ProductPricingShippingIntegrationTest {
    @Autowired private ProductPricingService pricingService;
    @Autowired private ProductPromotionService promotionService;
    @Autowired private ShippingService shippingService;
    @Autowired private ProductService productService;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private Validator validator;
    @Autowired private WebApplicationContext context;
    private Category category;
    private String prefix;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        prefix = "PRICING-" + UUID.randomUUID();
        category = categoryRepository.saveAndFlush(Category.builder().code(prefix).name(prefix).build());
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void strongestCurrentPromotionWinsAndTiesUseLowestIdentifier() {
        Product product = product("Instrument", "100.25", null, "0");
        createPromotion(product, "0.1", true, null, null);
        var strongest = createPromotion(product, "0.2", true, null, null);
        createPromotion(product, "0.2", true, null, null);
        createPromotion(product, "0.9", false, null, null);
        createPromotion(product, "0.8", true, null, Instant.now().minusSeconds(60));
        createPromotion(product, "0.7", true, Instant.now().plusSeconds(60), null);
        ProductPrice price = pricingService.resolvePrices(List.of(product)).get(product.getId());
        assertThat(price.originalUnitPrice()).isEqualByComparingTo("100.25");
        assertThat(price.chargedUnitPrice()).isEqualByComparingTo("80");
        assertThat(price.productDiscountAmount()).isEqualByComparingTo("20.25");
        assertThat(price.productPromotionId()).isEqualTo(strongest.id());
        assertThat(productService.getAdminProductDetail(product.getId()).price()).isEqualByComparingTo("100.25");
        assertThat(productService.getProductDetail(product.getId()).price()).isEqualByComparingTo("80");
    }

    @Test
    void roundingNeverIncreasesFractionalPriceAndZeroRatePreservesOriginal() {
        Product product = product("Rounding", "100.40", null, "0");
        var zero = createPromotion(product, "0", true, null, null);
        assertThat(pricingService.resolvePrices(List.of(product)).get(product.getId()).chargedUnitPrice()).isEqualByComparingTo("100.40");
        assertThat(pricingService.resolvePrices(List.of(product)).get(product.getId()).productPromotionId()).isNull();
        var originalFiltered = productService.listProducts(prefix, null, null, null, new BigDecimal("100.40"), new BigDecimal("100.40"), PageRequest.of(0, 10));
        assertThat(originalFiltered.getContent()).extracting(item -> item.id()).containsExactly(product.getId());
        product.setPrice(new BigDecimal("100.99"));
        productRepository.saveAndFlush(product);
        var tiny = createPromotion(product, "0.0001", true, null, null);
        var tinyPrice = pricingService.resolvePrices(List.of(product)).get(product.getId());
        assertThat(tinyPrice.chargedUnitPrice()).isEqualByComparingTo("100.99");
        assertThat(tinyPrice.productDiscountAmount()).isEqualByComparingTo("0");
        var free = createPromotion(product, "1", true, null, null);
        var freePrice = pricingService.resolvePrices(List.of(product)).get(product.getId());
        assertThat(freePrice.chargedUnitPrice()).isEqualByComparingTo("0");
        assertThat(freePrice.productPromotionId()).isEqualTo(free.id());
        promotionService.deletePromotion(free.id(), free.version());
        promotionService.deletePromotion(tiny.id(), tiny.version());
        promotionService.deletePromotion(zero.id(), zero.version());
    }

    @Test
    void catalogueFiltersAndSortsChargedPricesInsideDatabase() {
        Product discounted = product("A", "1000", null, "0");
        Product listed = product("B", "300", null, "0");
        createPromotion(discounted, "0.9", true, null, null);
        var filtered = productService.listProducts(prefix, null, null, null, new BigDecimal("90"), new BigDecimal("150"), PageRequest.of(0, 1));
        assertThat(filtered.getTotalElements()).isEqualTo(1);
        assertThat(filtered.getContent().getFirst().id()).isEqualTo(discounted.getId());
        assertThat(filtered.getContent().getFirst().originalPrice()).isEqualByComparingTo("1000");
        var ascending = productService.listProducts(prefix, null, null, null, null, null, PageRequest.of(0, 1, Sort.by("price")));
        assertThat(ascending.getTotalElements()).isEqualTo(2);
        assertThat(ascending.getContent().getFirst().id()).isEqualTo(discounted.getId());
        var descending = productService.listProducts(prefix, null, null, null, null, null, PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "price")));
        assertThat(descending.getContent().getFirst().id()).isEqualTo(listed.getId());
    }

    @Test
    void stalePromotionUpdateAndDeletePreserveLatestConfiguration() {
        Product product = product("Version", "1000", null, "0");
        var original = createPromotion(product, "0.1", true, null, null);
        var updated = promotionService.updatePromotion(original.id(), new UpdateProductPromotionRequest(product.getId(), "Updated", new BigDecimal("0.2"), true, null, null, original.version()));
        assertThat(updated.version()).isGreaterThan(original.version());
        assertThatThrownBy(() -> promotionService.updatePromotion(original.id(), new UpdateProductPromotionRequest(product.getId(), "Stale", BigDecimal.ZERO, false, null, null, original.version())))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> promotionService.deletePromotion(original.id(), original.version())).isInstanceOf(IllegalStateException.class);
        assertThat(pricingService.resolvePrices(List.of(product)).get(product.getId()).chargedUnitPrice()).isEqualByComparingTo("800");
    }

    @Test
    void disabledShippingNeverChargesOrRequiresMissingWeights() {
        var settings = shippingService.getSettings();
        shippingService.updateSettings(new UpdateShippingSettingsRequest(false, BigDecimal.ZERO, false, null, settings.version()));
        Product product = product("No weight", "100", null, "30000");
        var quote = shippingService.calculateShipping(List.of(new ShippingLine(product, 2)), new BigDecimal("200"));
        assertThat(quote.baseShippingFee()).isEqualByComparingTo("0");
        assertThat(quote.shippingFee()).isEqualByComparingTo("0");
        assertThat(quote.freeShippingApplied()).isFalse();
    }

    @Test
    void shippingUsesTotalWeightAndSurchargePerUnitAndRoundsOnlyOnce() {
        enableShipping("100.05", false, null);
        Product product = product("Weighted", "100", "0.111", "30000");
        var quote = shippingService.calculateShipping(List.of(new ShippingLine(product, 2)), new BigDecimal("200"));
        assertThat(quote.baseShippingFee()).isEqualByComparingTo("60022");
        assertThat(quote.shippingFee()).isEqualByComparingTo("60022");
        assertThat(quote.shippingDiscountAmount()).isEqualByComparingTo("0");
        Product missing = product("Missing", "100", null, "0");
        assertThatThrownBy(() -> shippingService.calculateShipping(List.of(new ShippingLine(missing, 1)), BigDecimal.TEN))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining(missing.getName());
    }

    @Test
    void configuredThresholdWaivesFeeAndStaleSettingsCannotOverwriteIt() {
        var initial = shippingService.getSettings();
        var saved = shippingService.updateSettings(new UpdateShippingSettingsRequest(true, new BigDecimal("15000"), true, new BigDecimal("3000000"), initial.version()));
        Product product = product("Threshold", "100", "2", "30000");
        var lower = shippingService.calculateShipping(List.of(new ShippingLine(product, 1)), new BigDecimal("2999999"));
        assertThat(lower.shippingFee()).isEqualByComparingTo("60000");
        var free = shippingService.calculateShipping(List.of(new ShippingLine(product, 1)), new BigDecimal("3000000"));
        assertThat(free.shippingFee()).isEqualByComparingTo("0");
        assertThat(free.shippingDiscountAmount()).isEqualByComparingTo(free.baseShippingFee());
        assertThat(free.freeShippingApplied()).isTrue();
        assertThatThrownBy(() -> shippingService.updateSettings(new UpdateShippingSettingsRequest(false, BigDecimal.ZERO, false, null, initial.version())))
                .isInstanceOf(IllegalStateException.class);
        assertThat(shippingService.getSettings().version()).isEqualTo(saved.version());
    }

    @Test
    void calculatedShippingRejectsMoneyOverflowEvenWhenThresholdWouldWaiveIt() {
        enableShipping("0", true, BigDecimal.ZERO);
        Product product = product("Overflow", "100", "1", "999999999999");
        assertThatThrownBy(() -> shippingService.calculateShipping(List.of(new ShippingLine(product, 2)), new BigDecimal("200")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("giới hạn");
    }

    @Test @WithMockUser(roles = "ADMIN")
    void promotionPagesOutsideDatabaseOffsetRangeReturnSafeBadRequest() throws Exception {
        mvc.perform(get("/api/v1/admin/product-promotions").param("page", String.valueOf(Integer.MAX_VALUE)).param("size", "100"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("giới hạn")));
    }

    @Test
    void invalidPeriodsRatesShippingPrecisionAndMissingThresholdAreRejected() {
        Product product = product("Validation", "100", null, "0");
        Instant now = Instant.now();
        assertThatThrownBy(() -> createPromotion(product, "0.1", true, now, now)).isInstanceOf(IllegalArgumentException.class);
        assertThat(validator.validate(new CreateProductPromotionRequest(product.getId(), "Program", new BigDecimal("0.00001"), true, null, null)))
                .anyMatch(v -> v.getPropertyPath().toString().equals("discountRate"));
        assertThat(validator.validate(new UpdateShippingSettingsRequest(true, new BigDecimal("100.001"), false, null, 0L)))
                .anyMatch(v -> v.getPropertyPath().toString().equals("ratePerKg"));
        var settings = shippingService.getSettings();
        assertThatThrownBy(() -> shippingService.updateSettings(new UpdateShippingSettingsRequest(true, BigDecimal.ZERO, true, null, settings.version())))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("ngưỡng");
    }

    @Test @WithMockUser(roles = "CUSTOMER")
    void customersCannotManagePricingConfiguration() throws Exception {
        mvc.perform(get("/api/v1/admin/product-promotions")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/shipping-settings")).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/admin/shipping-settings").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "ADMIN")
    void adminReceivesSafeFieldErrorsForOutOfRangePricePrograms() throws Exception {
        Product product = product("API", "100", null, "0");
        mvc.perform(post("/api/v1/admin/product-promotions").contentType("application/json")
                .content("{\"productId\":" + product.getId() + ",\"name\":\"Program\",\"discountRate\":1.1,\"isActive\":true}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.discountRate").exists());
    }

    private Product product(String suffix, String price, String weight, String surcharge) {
        return productRepository.saveAndFlush(Product.builder().code("P-" + UUID.randomUUID()).name(prefix + " " + suffix)
                .price(new BigDecimal(price)).category(category).billableWeightKg(weight == null ? null : new BigDecimal(weight))
                .bulkySurcharge(new BigDecimal(surcharge)).build());
    }

    private ProductPromotionResponse createPromotion(Product product, String rate, boolean active, Instant from, Instant until) {
        return promotionService.createPromotion(new CreateProductPromotionRequest(product.getId(), "Program", new BigDecimal(rate), active, from, until));
    }

    private void enableShipping(String rate, boolean free, BigDecimal threshold) {
        var current = shippingService.getSettings();
        shippingService.updateSettings(new UpdateShippingSettingsRequest(true, new BigDecimal(rate), free, threshold, current.version()));
    }
}
