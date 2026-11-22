package com.m4n.backend.service;

import com.m4n.backend.dto.request.AddToCartRequest;
import com.m4n.backend.dto.request.CreateProductRequest;
import com.m4n.backend.dto.request.CreateProductVariantsRequest;
import com.m4n.backend.dto.request.UpdateCartItemRequest;
import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ProductVariantsIntegrationTest {
    @Autowired private ProductService service;
    @Autowired private CartService cart;
    @Autowired private PosService pos;
    @Autowired private StockDocumentService receipts;
    @Autowired private InventoryService inventory;
    @Autowired private ProductRepository products;
    @Autowired private CategoryRepository categories;
    @Autowired private InventoryRepository stocks;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private org.springframework.transaction.PlatformTransactionManager transactions;
    private Category category;
    private String group;
    private User customer;
    private Product doTone;
    private Product reTone;

    @BeforeAll static void variantIndex(@Autowired JdbcTemplate jdbc) {
        // Same expression index as the deployment migration, also enforceable in dev tests.
        jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS products_variant_group_label_uq "
                + "ON products (lower(trim(variant_group)), lower(trim(variant_label))) WHERE variant_group IS NOT NULL");
    }

    @BeforeEach void fixtures() {
        group = "Sáo trúc " + UUID.randomUUID();
        category = categories.saveAndFlush(Category.builder().code("VAR-" + UUID.randomUUID()).name(group).build());
        customer = user(RoleName.CUSTOMER);
        doTone = variant("Tone Đô", "100000");
        reTone = variant("Tone Rê", "150000");
        setStock(doTone, 9);
        setStock(reTone, 2);
        authenticate(customer);
    }

    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test void variantSelectionIsPagedAndUsesEachSkusPriceAndInventory() {
        Product inactive = variant("Tone Mi", "200000");
        inactive.setActive(false);
        products.flush();
        var first = service.listVariants(doTone.getId(), PageRequest.of(0, 1));
        var second = service.listVariants(reTone.getId(), PageRequest.of(1, 1));
        assertThat(first.getTotalElements()).isEqualTo(2);
        assertThat(first.getContent()).hasSize(1);
        assertThat(second.getContent()).hasSize(1);
        assertThat(first.getContent().getFirst().id()).isNotEqualTo(second.getContent().getFirst().id());
        var detail = service.getProductDetail(reTone.getId());
        assertThat(detail.variantLabel()).isEqualTo("Tone Rê");
        assertThat(detail.name()).contains("Tone Rê");
        assertThat(detail.price()).isEqualByComparingTo("150000");
        assertThat(detail.stockQuantity()).isEqualTo(2);
        assertThat(service.listProducts("tone re", null, null, null, null, null, PageRequest.of(0, 10)).getContent())
                .extracting(item -> item.id()).contains(reTone.getId()).doesNotContain(doTone.getId());
    }

    @Test void addingAndEditingQuantitiesCannotExceedTheSelectedVariantsStock() {
        var initial = cart.addToCart(new AddToCartRequest(doTone.getId(), 9));
        Long itemId = initial.items().getFirst().id();
        assertThat(initial.items().getFirst().stockQuantity()).isEqualTo(9);
        assertThatThrownBy(() -> cart.addToCart(new AddToCartRequest(doTone.getId(), 1)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("chỉ còn 9");
        assertThatThrownBy(() -> cart.updateCartItem(itemId, new UpdateCartItemRequest(15)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("chỉ còn 9");
        var both = cart.addToCart(new AddToCartRequest(reTone.getId(), 2));
        assertThat(both.items()).hasSize(2);
        assertThat(both.items()).extracting(item -> item.productName()).anyMatch(name -> name.contains("Tone Rê"));
        assertThat(cart.getMyCart().items().stream().filter(item -> item.id().equals(itemId)).findFirst().orElseThrow().quantity()).isEqualTo(9);
        assertThat(stocks.findByProductId(doTone.getId()).orElseThrow().getQuantity()).isEqualTo(9);
        assertThat(stocks.findByProductId(reTone.getId()).orElseThrow().getQuantity()).isEqualTo(2);
    }

    @Test void posDeductsOnlyTheChosenSkuAndSnapshotsItsVariantName() {
        authenticate(user(RoleName.POS_STAFF));
        var sale = pos.finalizeSale(PosSaleRequest.builder()
                .items(List.of(new PosSaleItemRequest(reTone.getId(), 1)))
                .paymentMethod("CASH").amountReceived(new BigDecimal("150000")).build());
        assertThat(sale.getItems()).hasSize(1);
        assertThat(sale.getItems().getFirst().getProductName()).contains("Tone Rê");
        assertThat(stocks.findByProductId(reTone.getId()).orElseThrow().getQuantity()).isEqualTo(1);
        assertThat(stocks.findByProductId(doTone.getId()).orElseThrow().getQuantity()).isEqualTo(9);
    }

    @Test void duplicateVariantAndIncompletePairAreRejectedBeforeCreation() {
        assertThatThrownBy(() -> service.createProduct(request(group.toUpperCase(), "TONE RÊ", "150000")))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        assertThatThrownBy(() -> service.createProduct(request(group, null, "150000")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void databaseAlsoRejectsCaseInsensitiveDuplicateLabels() {
        Product duplicate = Product.builder().code("DUP-" + UUID.randomUUID()).name("Sáo")
                .category(category).price(new BigDecimal("100000")).variantGroup(group.toUpperCase())
                .variantLabel("TONE RÊ").build();
        assertThatThrownBy(() -> products.saveAndFlush(duplicate))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test void ungroupedProductsStillWorkAndNewSkusStartWithZeroStock() {
        var created = service.createProduct(request(null, null, "100000"));
        assertThat(created.stockQuantity()).isZero();
        var options = service.listVariants(created.id(), PageRequest.of(0, 20));
        assertThat(options.getTotalElements()).isEqualTo(1);
        assertThat(options.getContent().getFirst().variantLabel()).isNull();
    }

    @Test void createsSeveralVariantsWithIndependentPricesAndAutomaticIdentifiers() {
        var created = service.createVariants(new CreateProductVariantsRequest(List.of(
                request(group, "Tone Fa", "120000"), request(group, "Tone Sol", "190000"))));
        assertThat(created).hasSize(2);
        assertThat(created).extracting(item -> item.variantLabel()).containsExactly("Tone Fa", "Tone Sol");
        assertThat(created.getFirst().price()).isEqualByComparingTo("120000");
        assertThat(created.getLast().price()).isEqualByComparingTo("190000");
        assertThat(created).extracting(item -> item.id()).doesNotHaveDuplicates();
        assertThat(created).extracting(item -> item.barcode()).doesNotHaveDuplicates().doesNotContainNull();
        assertThat(created).allSatisfy(item -> assertThat(item.stockQuantity()).isZero());
    }

    @Test void addingOneVariantCreatesOnlyOneNewSkuAndKeepsExistingPricesAndStocks() {
        var created = service.createProduct(request(group, "Tone La", "150000", false));
        assertThat(created.isActive()).isFalse();
        assertThat(created.stockQuantity()).isZero();
        assertThat(created.price()).isEqualByComparingTo("150000");
        assertThat(service.listAdminVariants(doTone.getId(), PageRequest.of(0, 20)).getTotalElements()).isEqualTo(3);
        assertThat(service.listVariants(doTone.getId(), PageRequest.of(0, 20)).getContent())
                .extracting(item -> item.id()).doesNotContain(created.id());
        assertThat(service.getAdminProductDetail(doTone.getId()).stockQuantity()).isEqualTo(9);
        assertThat(service.getAdminProductDetail(reTone.getId()).stockQuantity()).isEqualTo(2);
        assertThat(service.getAdminProductDetail(reTone.getId()).price()).isEqualByComparingTo("150000");
    }

    @Test void newBatchHonorsEachSkusSellingStatusAndDefaultsToActive() {
        var created = service.createVariants(new CreateProductVariantsRequest(List.of(
                request(group, "Tone La", "150000", false), request(group, "Tone Si", "150000", true),
                request(group, "Tone Fa", "150000"))));
        assertThat(created).extracting(item -> item.isActive()).containsExactly(false, true, true);
        assertThat(created).allSatisfy(item -> assertThat(item.stockQuantity()).isZero());
    }

    @Test void failedBatchRollsBackAllCreatedSkusAndStocks() {
        var transaction = new org.springframework.transaction.support.TransactionTemplate(transactions);
        transaction.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        String batchGroup = "Rollback " + UUID.randomUUID();
        String firstCode = "BATCH-" + UUID.randomUUID();
        assertThatThrownBy(() -> transaction.executeWithoutResult(status -> {
            var ownCategory = categories.saveAndFlush(Category.builder().code("BATCH-" + UUID.randomUUID()).name("Sáo").build());
            var first = new CreateProductRequest(firstCode, null, "Sáo", new BigDecimal("100000"), ownCategory.getId(),
                    null, null, null, null, null, null, null, List.of(), 5, null, null, batchGroup, "Tone Đô", null, null);
            service.createVariants(new CreateProductVariantsRequest(List.of(first, first)));
        })).isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        assertThat(products.existsByCodeIgnoreCase(firstCode)).isFalse();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM products WHERE variant_group = ?", Long.class, batchGroup)).isZero();
    }

    @Test void adminCanChooseInactiveAndZeroStockVariantsForReceiving() {
        reTone.setActive(false);
        products.saveAndFlush(reTone);
        var options = service.listAdminVariants(reTone.getId(), PageRequest.of(0, 20));
        assertThat(options.getContent()).extracting(item -> item.id()).contains(doTone.getId(), reTone.getId());
        assertThat(service.listVariants(doTone.getId(), PageRequest.of(0, 20)).getContent())
                .extracting(item -> item.id()).containsExactly(doTone.getId());
        assertThatThrownBy(() -> service.createVariants(new CreateProductVariantsRequest(List.of(
                request(group, "Tone Fa", "100000"), request("Other group", "Tone Sol", "100000")))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("cùng một nhóm");
    }

    @Test void receiptQcAddsOnlyTheChosenVariantsAcceptedQuantityAndKeepsSalePrice() {
        authenticate(user(RoleName.ADMIN));
        var input = new com.m4n.backend.dto.request.StockImportRequest();
        input.setQuantity(5);
        input.setUnitCost(new BigDecimal("40000"));
        var draft = receipts.createReceipt(reTone.getId(), input);
        assertThat(stocks.findByProductId(reTone.getId()).orElseThrow().getQuantity()).isEqualTo(2);
        var confirmed = receipts.confirm(draft.id(), new com.m4n.backend.dto.request.ConfirmStockDocumentRequest(2, "Hai cây không đạt QC"));
        assertThat(confirmed.productName()).contains("Tone Rê");
        assertThat(confirmed.receivedAmount()).isEqualByComparingTo("120000");
        assertThat(stocks.findByProductId(reTone.getId()).orElseThrow().getQuantity()).isEqualTo(5);
        assertThat(stocks.findByProductId(doTone.getId()).orElseThrow().getQuantity()).isEqualTo(9);
        assertThat(service.getAdminProductDetail(reTone.getId()).price()).isEqualByComparingTo("150000");
        assertThat(inventory.listInventory(group, null, PageRequest.of(0, 20)).getContent())
                .extracting(item -> item.getProductId()).contains(doTone.getId(), reTone.getId());
    }

    @Test void maximumLengthBaseNameAndVariantLabelFitTransactionSnapshots() {
        reTone.setName("N".repeat(200));
        reTone.getFamily().setName("N".repeat(200));
        reTone.setVariantLabel("T".repeat(100));
        products.saveAndFlush(reTone);
        authenticate(user(RoleName.POS_STAFF));
        var sale = pos.finalizeSale(PosSaleRequest.builder()
                .items(List.of(new PosSaleItemRequest(reTone.getId(), 1)))
                .paymentMethod("CASH").amountReceived(new BigDecimal("150000")).build());
        assertThat(sale.getItems().getFirst().getProductName()).hasSize(303);
    }

    private Product variant(String label, String price) {
        return products.findById(service.createProduct(request(group, label, price)).id()).orElseThrow();
    }

    private CreateProductRequest request(String family, String label, String price) {
        return request(family, label, price, null);
    }

    private CreateProductRequest request(String family, String label, String price, Boolean active) {
        return new CreateProductRequest("SKU-" + UUID.randomUUID(), null, "Sáo trúc", new BigDecimal(price), category.getId(),
                null, null, "Tre", "60 cm", null, "Việt Nam", null, List.of(), 5,
                new BigDecimal("0.2"), BigDecimal.ZERO, family, label, active, null);
    }

    private void setStock(Product product, int quantity) {
        var stock = stocks.findByProductId(product.getId()).orElseThrow();
        stock.setQuantity(quantity);
        stocks.saveAndFlush(stock);
    }

    private User user(RoleName role) {
        return users.saveAndFlush(User.builder().email(UUID.randomUUID() + "@variants.m4n.test")
                .password("encoded-test-only").fullName("Variant fixture").isActive(true)
                .role(roles.findByName(role).orElseThrow()).build());
    }

    private void authenticate(User account) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(account.getEmail(), null,
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + account.getRole().getName()))));
    }
}
