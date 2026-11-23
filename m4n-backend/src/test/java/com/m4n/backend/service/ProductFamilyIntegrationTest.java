package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest @Transactional
class ProductFamilyIntegrationTest {
    @Autowired ProductService products;
    @Autowired InventoryService inventory;
    @Autowired ProductPricingService pricing;
    @Autowired ProductPromotionService promotions;
    @Autowired PosService pos;
    @Autowired ProductRepository productRepository;
    @Autowired InventoryRepository stocks;
    @Autowired CategoryRepository categories;
    @Autowired ProductFamilyRepository families;
    @Autowired StockDocumentService documents;
    @Autowired org.springframework.web.context.WebApplicationContext context;
    private Category category;
    private String name;

    @BeforeAll static void familyIndex(@Autowired org.springframework.jdbc.core.JdbcTemplate jdbc) {
        jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS products_family_label_uq ON products(family_id, lower(btrim(COALESCE(variant_label, '')))) WHERE family_id IS NOT NULL");
    }

    @BeforeEach void setup() {
        name = "Sáo biểu diễn " + UUID.randomUUID();
        category = categories.saveAndFlush(Category.builder().code("F-" + UUID.randomUUID()).name(name).build());
    }

    @Test void parentOwnsSeveralSkusAndGroupedPagingCountsProductsBeforePagination() {
        var variants = products.createVariants(new CreateProductVariantsRequest(List.of(request(null, "C", "100000"), request(null, "D", "150000"))));
        var another = products.createProduct(request(null, "C", "90000"));
        assertThat(variants.getFirst().familyId()).isEqualTo(variants.getLast().familyId()).isNotEqualTo(another.familyId());
        setStock(variants.getFirst().id(), 3);
        setStock(variants.getLast().id(), 7);
        productRepository.flush();
        assertThat(families.findById(variants.getFirst().familyId()).orElseThrow().getVariants()).hasSize(2);
        var first = products.listProducts(name, null, null, null, null, null, PageRequest.of(0, 1, Sort.by("id")), true);
        var second = products.listProducts(name, null, null, null, null, null, PageRequest.of(1, 1, Sort.by("id")), true);
        assertThat(first.getTotalElements()).isEqualTo(2);
        assertThat(first.getContent().getFirst().familyId()).isNotEqualTo(second.getContent().getFirst().familyId());
        assertThat(first.getContent().getFirst().variantCount()).isEqualTo(2);
        assertThat(first.getContent().getFirst().stockQuantity()).isEqualTo(10);
        var balance = inventory.listInventoryFamilies(name, null, PageRequest.of(0, 10));
        assertThat(balance.getTotalElements()).isEqualTo(2);
        assertThat(balance.getContent().stream().filter(item -> variants.getFirst().familyId().equals(item.getFamilyId())).findFirst().orElseThrow().getQuantity()).isEqualTo(10);
        assertThat(products.listAdminProducts(name, null, null, null, null, PageRequest.of(0, 10), true).getTotalElements()).isEqualTo(2);
        var categoryCount = productRepository.countProductsGroupedByCategoryId().stream()
                .filter(row -> category.getId().equals(row[0])).findFirst().orElseThrow();
        assertThat(((Number) categoryCount[1]).longValue()).isEqualTo(2);
    }

    @Test void newVariantJoinsExistingParentWithoutManualGroupAndTinyPositiveWeightIsPreserved() {
        var first = products.createProduct(request(null, null, "100000"));
        var variant = products.createProduct(request(first.familyId(), "D", "150000"));
        assertThat(variant.familyId()).isEqualTo(first.familyId());
        assertThat(variant.stockQuantity()).isZero();
        assertThat(productRepository.findById(variant.id()).orElseThrow().getBillableWeightKg()).isEqualByComparingTo("0.000001");
        assertThat(products.listAdminVariants(first.id(), PageRequest.of(0, 20)).getTotalElements()).isEqualTo(2);
        assertThatThrownBy(() -> products.createProduct(request(first.familyId(), "d", "100000")))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
    }

    @Test void inactiveStockIsExcludedFromCatalogButIncludedInGroupedAdminBalance() {
        var created = products.createVariants(new CreateProductVariantsRequest(List.of(request(null, "C", "100000"), request(null, "D", "150000"))));
        setStock(created.getLast().id(), 8);
        products.updateProductStatus(created.getLast().id(), false);
        var publicRow = products.listProducts(name, null, null, null, null, null, PageRequest.of(0, 10), true).getContent().getFirst();
        assertThat(publicRow.stockQuantity()).isZero();
        assertThat(publicRow.variantCount()).isEqualTo(1);
        var adminRow = inventory.listInventoryFamilies(name, "IN_STOCK", PageRequest.of(0, 10)).getContent().getFirst();
        assertThat(adminRow.getQuantity()).isEqualTo(8);
        assertThat(adminRow.getVariantCount()).isEqualTo(2);
        assertThat(inventory.listInventoryFamilies(name, "LOW_STOCK", PageRequest.of(0, 10)).getContent()).isEmpty();
        assertThat(inventory.listInventoryFamilies(name, "OUT_OF_STOCK", PageRequest.of(0, 10)).getContent()).isEmpty();
    }

    @Test void twoAttributeVariantMatrixCreatesCombinationsAndRejectsDuplicatesOrMissingDimension() {
        var matrix = products.createVariants(new CreateProductVariantsRequest(List.of(
                optionRequest(null, "Chất liệu", "Số dây", "Gỗ trắc", "16 dây", "5000000"),
                optionRequest(null, "Chất liệu", "Số dây", "Gỗ trắc", "18 dây", "5500000"),
                optionRequest(null, "Chất liệu", "Số dây", "Gỗ mun", "16 dây", "6000000"),
                optionRequest(null, "Chất liệu", "Số dây", "Gỗ mun", "18 dây", "6500000"))));
        assertThat(matrix).hasSize(4);
        Long familyId = matrix.getFirst().familyId();
        assertThat(matrix).allSatisfy(item -> {
            assertThat(item.familyId()).isEqualTo(familyId);
            assertThat(item.option1Name()).isEqualTo("Chất liệu");
            assertThat(item.option2Name()).isEqualTo("Số dây");
        });
        assertThat(matrix).extracting(item -> item.variantLabel())
                .containsExactly("Gỗ trắc · 16 dây", "Gỗ trắc · 18 dây", "Gỗ mun · 16 dây", "Gỗ mun · 18 dây");
        var listed = products.listVariants(matrix.getFirst().id(), PageRequest.of(0, 100));
        assertThat(listed.getTotalElements()).isEqualTo(4);
        assertThat(listed.getContent()).allSatisfy(item -> {
            assertThat(item.option1Name()).isEqualTo("Chất liệu");
            assertThat(item.option2Name()).isEqualTo("Số dây");
            assertThat(item.option1Value()).isNotBlank();
            assertThat(item.option2Value()).isNotBlank();
        });
        assertThatThrownBy(() -> products.createProduct(optionRequest(familyId, "Chất liệu", "Số dây", "Gỗ trắc", "16 dây", "5000000")))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        assertThatThrownBy(() -> products.createProduct(optionRequest(familyId, "Chất liệu", "Số dây", "Gỗ hương", null, "7000000")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void stockPrioritySortingBringsOutOfStockAndLowStockToFirstPageAcrossInventoryAndAdminProducts() {
        var plenty = products.createProduct(request(null, null, "100000"));
        var low = products.createProduct(request(null, null, "100000"));
        var emptyCreatedLast = products.createProduct(request(null, null, "100000"));
        setStock(plenty.id(), 20);
        setStock(low.id(), 3);
        setStock(emptyCreatedLast.id(), 0);

        var invPage0 = inventory.listInventoryFamilies(name, null, PageRequest.of(0, 2, Sort.by(Sort.Direction.ASC, "quantity")));
        assertThat(invPage0.getContent()).extracting(item -> item.getProductId())
                .containsExactly(emptyCreatedLast.id(), low.id());
        var invDesc = inventory.listInventoryFamilies(name, null, PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "quantity")));
        assertThat(invDesc.getContent()).extracting(item -> item.getProductId())
                .containsExactly(plenty.id(), low.id(), emptyCreatedLast.id());

        var prodPage0 = products.listAdminProducts(name, null, null, null, null,
                PageRequest.of(0, 2, Sort.by(Sort.Direction.ASC, "stockQuantity")), true);
        assertThat(prodPage0.getContent()).extracting(item -> item.id())
                .containsExactly(emptyCreatedLast.id(), low.id());
        var prodDesc = products.listAdminProducts(name, null, null, null, null,
                PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "stockQuantity")), true);
        assertThat(prodDesc.getContent()).extracting(item -> item.id())
                .containsExactly(plenty.id(), low.id(), emptyCreatedLast.id());
    }

    @Test void multiProductProgramAppliesToEachSelectedParentsVariantsAndNewSkus() {
        var first = products.createProduct(request(null, "C", "100000"));
        var second = products.createProduct(request(null, "C", "200000"));
        var excluded = products.createProduct(request(null, "C", "300000"));
        var program = promotions.createPromotion(new CreateProductPromotionRequest(null, "Hai sản phẩm", new BigDecimal("0.2"), true, null, null,
                List.of(first.familyId(), second.familyId())));
        var added = products.createProduct(request(first.familyId(), "D", "150000"));
        var skus = productRepository.findAllById(List.of(first.id(), second.id(), excluded.id(), added.id()));
        var prices = pricing.resolvePrices(skus);
        assertThat(prices.get(first.id()).chargedUnitPrice()).isEqualByComparingTo("80000");
        assertThat(prices.get(second.id()).chargedUnitPrice()).isEqualByComparingTo("160000");
        assertThat(prices.get(added.id()).chargedUnitPrice()).isEqualByComparingTo("120000");
        assertThat(prices.get(excluded.id()).chargedUnitPrice()).isEqualByComparingTo("300000");
        assertThat(program.products()).hasSize(2);
        assertThat(promotions.listPromotions(added.id(), true, 0, 10).getTotalElements()).isEqualTo(1);
        var filtered = products.listProducts(name, null, null, null, new BigDecimal("100000"), new BigDecimal("160000"),
                PageRequest.of(0, 10, Sort.by("price")), true);
        assertThat(filtered.getTotalElements()).isEqualTo(2);
        assertThat(filtered.getContent()).extracting(item -> item.price()).containsExactly(new BigDecimal("120000"), new BigDecimal("160000"));
    }

    @Test void promotionRejectsInvalidTargetsAndValidatesOneHourFromCreationAndStart() {
        var first = products.createProduct(request(null, "C", "100000"));
        var future = Instant.now().plusSeconds(7200);
        assertThatThrownBy(() -> promotions.createPromotion(new CreateProductPromotionRequest(null, "Too short", BigDecimal.ZERO, true, future, future.plusSeconds(3599), List.of(first.familyId()))))
                .isInstanceOf(IllegalArgumentException.class);
        var valid = promotions.createPromotion(new CreateProductPromotionRequest(null, "Exact hour", BigDecimal.ZERO, true, future, future.plusSeconds(3600), List.of(first.familyId())));
        assertThat(valid.validUntil()).isEqualTo(future.plusSeconds(3600));
        assertThatThrownBy(() -> promotions.createPromotion(new CreateProductPromotionRequest(null, "Creation bound", BigDecimal.ZERO, true, null, Instant.now().plusSeconds(3599), List.of(first.familyId()))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> promotions.createPromotion(new CreateProductPromotionRequest(null, "Duplicate", BigDecimal.ZERO, true, null, null, List.of(first.familyId(), first.familyId()))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> promotions.createPromotion(new CreateProductPromotionRequest(null, "Empty", BigDecimal.ZERO, true, null, null, List.of())))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void oldSingleSkuProgramDoesNotExpandUntilExplicitlyEditedAndEditsUseOriginalCreation() {
        var first = products.createProduct(request(null, "C", "100000"));
        var otherTone = products.createProduct(request(first.familyId(), "D", "100000"));
        var program = promotions.createPromotion(new CreateProductPromotionRequest(first.id(), "Legacy SKU", new BigDecimal("0.1"), true, null, null, null));
        assertThat(pricing.resolvePrices(productRepository.findAllById(List.of(first.id(), otherTone.id()))).get(otherTone.id()).chargedUnitPrice()).isEqualByComparingTo("100000");
        var edited = promotions.updatePromotion(program.id(), new UpdateProductPromotionRequest(null, "Parent selection", new BigDecimal("0.1"), true,
                null, program.createdAt().plusSeconds(3600), program.version(), List.of(first.familyId())));
        assertThat(edited.validUntil()).isEqualTo(program.createdAt().plusSeconds(3600));
        assertThat(pricing.resolvePrices(productRepository.findAllById(List.of(first.id(), otherTone.id()))).get(otherTone.id()).chargedUnitPrice()).isEqualByComparingTo("90000");
        assertThatThrownBy(() -> promotions.updatePromotion(program.id(), new UpdateProductPromotionRequest(null, "Stale", BigDecimal.ZERO, false, null, null,
                program.version(), List.of(first.familyId())))).isInstanceOf(IllegalStateException.class);
    }

    @Test void parentRenameIsSearchableEvenWhenTheEditedSkuIsInactive() {
        var first = products.createProduct(request(null, "C", "100000"));
        var second = products.createProduct(request(first.familyId(), "D", "150000"));
        products.updateProductStatus(second.id(), false);
        String renamed = "Tên mới " + UUID.randomUUID();
        var family = families.findById(first.familyId()).orElseThrow();
        family.setName(renamed);
        families.flush();
        var result = products.listProducts(renamed, null, null, null, null, null, PageRequest.of(0, 10), true);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().familyName()).isEqualTo(renamed);
        assertThat(products.getAdminProductDetail(first.id()).name()).isEqualTo(renamed);
        assertThat(pos.searchProducts(renamed)).extracting(item -> item.getId()).containsExactly(first.id());
    }

    @Test void posLimitsLogicalProductsRatherThanSkusAndKeepsExactBarcodeLookup() {
        var variants = products.createVariants(new CreateProductVariantsRequest(java.util.stream.IntStream.range(0, 45)
                .mapToObj(index -> request(null, "Tone " + index, "100000")).toList()));
        var separate = products.createProduct(request(null, null, "200000"));
        var results = pos.searchProducts(name);
        assertThat(results).extracting(item -> item.getId()).containsExactly(variants.getFirst().id(), separate.id());
        assertThat(results.getFirst().getVariantCount()).isEqualTo(45);
        assertThat(results.getLast().getVariantCount()).isEqualTo(1);
        String plainName = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        assertThat(pos.searchProducts(plainName)).hasSize(2);
        var selected = variants.get(40);
        assertThat(pos.lookupBarcode(selected.barcode()).getId()).isEqualTo(selected.id());
        assertThat(products.listVariants(variants.getFirst().id(), PageRequest.of(1, 20)).getTotalElements()).isEqualTo(45);
    }

    @Test @org.springframework.security.test.context.support.WithMockUser(username = "family-audit@m4n.test", roles = "ADMIN")
    void familyHistoryIncludesEachVariantsQcWhileSkuHistoryStaysSpecific() {
        var first = products.createProduct(request(null, "C", "100000"));
        var second = products.createProduct(request(first.familyId(), "D", "150000"));
        for (var sku : List.of(first, second)) {
            var input = new StockImportRequest();
            input.setQuantity(3);
            input.setUnitCost(new BigDecimal("50000"));
            var receipt = documents.createReceipt(sku.id(), input);
            documents.confirm(receipt.id(), new ConfirmStockDocumentRequest(sku.id().equals(first.id()) ? 1 : 0, "QC"));
        }
        assertThat(inventory.listInventoryFamilies(name, null, PageRequest.of(0, 10)).getContent().getFirst().getQuantity()).isEqualTo(5);
        assertThat(inventory.listMovements(null, first.familyId(), null, PageRequest.of(0, 10)).getContent())
                .extracting(item -> item.productId()).containsExactlyInAnyOrder(first.id(), second.id());
        assertThat(inventory.listMovements(first.id(), null, PageRequest.of(0, 10)).getTotalElements()).isEqualTo(1);
        assertThat(documents.list(null, first.familyId(), null, null, PageRequest.of(0, 10)).getTotalElements()).isEqualTo(2);
        assertThat(documents.list(first.id(), null, null, PageRequest.of(0, 10)).getTotalElements()).isEqualTo(1);
    }

    @Test void groupedHttpListsAndMultiTargetRequestsPreservePublicAndAdminBoundaries() throws Exception {
        var first = products.createProduct(request(null, "C", "100000"));
        products.createProduct(request(first.familyId(), "D", "150000"));
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup(context)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/products")
                        .param("keyword", name).param("groupVariants", "true"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.totalElements").value(1))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.content[0].variantCount").value(2));
        String path = "/api/v1/admin/product-promotions";
        String body = "{\"familyIds\":[" + first.familyId() + "],\"name\":\"Multi\",\"discountRate\":0.1,\"isActive\":true}";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).contentType("application/json").content(body))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).contentType("application/json").content(body)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("customer@m4n.test").roles("CUSTOMER")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).contentType("application/json").content(body)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@m4n.test").roles("ADMIN")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isCreated())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.products.length()").value(1));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).contentType("application/json")
                        .content("{\"familyIds\":[null],\"name\":\"Bad\",\"discountRate\":0.1,\"isActive\":true}")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@m4n.test").roles("ADMIN")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
    }

    @Test void updatingStructuredProductCanRenameFamilyOptionsAndBlocksDroppingUsedOption2() {
        var created = products.createVariants(new CreateProductVariantsRequest(List.of(
                optionRequest(null, "Chất liệu", "Số dây", "Gỗ trắc", "16 dây", "5000000"),
                optionRequest(null, "Chất liệu", "Số dây", "Gỗ mun", "18 dây", "6000000")
        )));
        var first = created.get(0);
        var second = created.get(1);

        var renamed = products.updateProduct(first.id(), new com.m4n.backend.dto.request.UpdateProductRequest(
                name, first.barcode(), new BigDecimal("5200000"), category.getId(), null, null,
                null, null, null, null, null, true, null, 5, new BigDecimal("0.000001"), BigDecimal.ZERO,
                null, null, "Loại gỗ", "Cấu hình dây", "Gỗ trắc", "16 dây"));
        assertThat(renamed.option1Name()).isEqualTo("Loại gỗ");
        assertThat(renamed.option2Name()).isEqualTo("Cấu hình dây");
        var refreshedSecond = products.getAdminProductDetail(second.id());
        assertThat(refreshedSecond.option1Name()).isEqualTo("Loại gỗ");
        assertThat(refreshedSecond.option2Name()).isEqualTo("Cấu hình dây");

        assertThatThrownBy(() -> products.updateProduct(first.id(), new com.m4n.backend.dto.request.UpdateProductRequest(
                name, first.barcode(), new BigDecimal("5200000"), category.getId(), null, null,
                null, null, null, null, null, true, null, 5, new BigDecimal("0.000001"), BigDecimal.ZERO,
                null, null, "Loại gỗ", null, "Gỗ trắc", null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nhóm phân loại 2");
    }

    private CreateProductRequest request(Long family, String tone, String price) {
        return new CreateProductRequest(null, null, name, new BigDecimal(price), category.getId(), null, null,
                null, null, null, null, null, List.of(), 5, new BigDecimal("0.000001"), BigDecimal.ZERO, null, tone, true, family);
    }

    private CreateProductRequest optionRequest(Long family, String opt1Name, String opt2Name, String opt1Val, String opt2Val, String price) {
        return new CreateProductRequest(null, null, name, new BigDecimal(price), category.getId(), null, null,
                null, null, null, null, null, List.of(), 5, new BigDecimal("0.000001"), BigDecimal.ZERO, null, null, true, family,
                opt1Name, opt2Name, opt1Val, opt2Val);
    }

    private void setStock(Long id, int quantity) {
        var stock = stocks.findByProductId(id).orElseThrow();
        stock.setQuantity(quantity);
        stocks.saveAndFlush(stock);
    }
}
