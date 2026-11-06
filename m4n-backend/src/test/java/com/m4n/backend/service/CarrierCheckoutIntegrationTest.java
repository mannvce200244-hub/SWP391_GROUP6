package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.ShippingOptionsResponse;
import com.m4n.backend.dto.response.ShippingSettingsResponse;
import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@SpringBootTest
class CarrierCheckoutIntegrationTest {
    @Autowired CartService carts;
    @Autowired OrderService orders;
    @Autowired ShippingService shipping;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired InventoryRepository inventory;
    @Autowired OrderRepository orderRepository;
    @Autowired VoucherRepository vouchers;
    @Autowired CartRepository cartRepository;
    @Autowired NotificationRepository notifications;
    @MockitoBean GhnService carrier;
    User customer;
    Product product;
    Long selected;
    Category category;
    Voucher createdVoucher;
    List<Long> activeVoucherIds;
    ShippingSettingsResponse initialShipping;
    final DeliveryAddressRequest address = new DeliveryAddressRequest(1, 2, "12 Street");

    @BeforeEach void fixtures() {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        customer = users.saveAndFlush(User.builder().email("carrier-" + suffix + "@example.test")
                .fullName("Carrier customer").password("fixture-only").role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        category = categories.saveAndFlush(Category.builder().code("C-" + suffix).name("Carrier fixture").build());
        product = products.saveAndFlush(Product.builder().code("P-" + suffix).name("Instrument")
                .category(category).price(new BigDecimal("100000")).billableWeightKg(BigDecimal.ONE)
                .dimensions("30 x 20 x 10 cm").build());
        inventory.saveAndFlush(Inventory.builder().product(product).quantity(5).build());
        // Isolate configured promotions without changing persisted deployment rules.
        var active = vouchers.findAll().stream().filter(Voucher::isActive).toList();
        activeVoucherIds = active.stream().map(Voucher::getId).toList();
        active.forEach(v -> v.setActive(false));
        vouchers.saveAllAndFlush(active);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer.getEmail(), "test", List.of()));
        carts.addToCart(new AddToCartRequest(product.getId(), 1));
        selected = carts.getMyCart().items().getFirst().id();
        when(carrier.getOptions()).thenReturn(new ShippingOptionsResponse(true, true, "PROVINCE_WARD"));
        quote("35000");
        initialShipping = shipping.getSettings();
        shipping.updateSettings(new UpdateShippingSettingsRequest(true, BigDecimal.ZERO, false, null, initialShipping.version()));
    }

    @AfterEach void cleanup() {
        SecurityContextHolder.clearContext();
        if (customer != null) {
            notifications.deleteAll(notifications.findTop20ByUserIdOrderByCreatedAtDesc(customer.getId()));
            orderRepository.deleteAll(orderRepository.findByUserId(customer.getId(), PageRequest.of(0, 100)));
            cartRepository.findByUserId(customer.getId()).ifPresent(cartRepository::delete);
        }
        if (createdVoucher != null) vouchers.deleteById(createdVoucher.getId());
        if (product != null) { inventory.findByProductId(product.getId()).ifPresent(inventory::delete); products.deleteById(product.getId()); }
        if (category != null) categories.deleteById(category.getId());
        if (customer != null) users.deleteById(customer.getId());
        if (activeVoucherIds != null) {
            var active = vouchers.findAllById(activeVoucherIds); active.forEach(v -> v.setActive(true)); vouchers.saveAllAndFlush(active);
        }
        if (initialShipping != null) shipping.updateSettings(new UpdateShippingSettingsRequest(initialShipping.enabled(),
                initialShipping.ratePerKg(), initialShipping.freeShippingEnabled(), initialShipping.freeShippingThreshold(), shipping.getSettings().version()));
    }

    @Test void checkoutPersistsCanonicalAddressAndFeeWithoutDeductingStock() {
        var preview = orders.previewCheckout(preview(null));
        assertThat(preview.shippingFee()).isEqualByComparingTo("35000");
        assertThat(preview.finalAmount()).isEqualByComparingTo("135000");
        var placed = orders.placeOrder(request(null, "35000"));
        var stored = orderRepository.findById(placed.id()).orElseThrow();
        assertThat(stored.getShippingAddress()).isEqualTo("12 Street, Ward, Province");
        assertThat(stored.getShippingProvinceId()).isEqualTo(1);
        assertThat(stored.getShippingWardId()).isEqualTo(2);
        assertThat(stored.getFinalAmount()).isEqualByComparingTo(preview.finalAmount());
        assertThat(carts.getMyCart().items()).isEmpty();
        assertThat(inventory.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(5);
    }

    @Test void missingPreviewBodyReturnsValidationErrorWhenCarrierAddressIsRequired() {
        assertThatThrownBy(() -> orders.previewCheckout(null)).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("địa chỉ");
        assertThat(carts.getMyCart().items()).hasSize(1);
    }

    @Test void changedQuoteRejectsOrderAndRollsBackVoucherUsageAndCartConsumption() {
        var voucher = shipVoucher();
        assertThat(orders.previewCheckout(preview(voucher.getCode())).shippingFee()).isEqualByComparingTo("25000");
        quote("40000");
        assertThatThrownBy(() -> orders.placeOrder(request(voucher.getCode(), "25000")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("vận chuyển");
        assertThat(carts.getMyCart().items()).extracting(i -> i.id()).containsExactly(selected);
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();
        assertThat(orderRepository.findByUserId(customer.getId(), PageRequest.of(0, 10))).isEmpty();
    }

    @Test void freeshipPrecedesShippingVoucherAndVoucherOnlyReducesCarrierFee() {
        var voucher = shipVoucher();
        var discounted = orders.previewCheckout(preview(voucher.getCode()));
        assertThat(discounted.shippingFee()).isEqualByComparingTo("25000");
        assertThat(discounted.finalAmount()).isEqualByComparingTo("125000");
        var settings = shipping.getSettings();
        shipping.updateSettings(new UpdateShippingSettingsRequest(true, BigDecimal.ZERO, true, new BigDecimal("100000"), settings.version()));
        var free = orders.previewCheckout(preview(voucher.getCode()));
        assertThat(free.freeShippingApplied()).isTrue();
        assertThat(free.shippingFee()).isEqualByComparingTo("0");
        assertThat(free.finalAmount()).isEqualByComparingTo("100000");
        assertThat(free.shippingVoucherApplied()).isFalse();
    }

    private Voucher shipVoucher() {
        createdVoucher = vouchers.saveAndFlush(Voucher.builder().code("SHIP-" + UUID.randomUUID().toString().replace("-", ""))
                .promotionType(PromotionType.SHIPPING).discountRate(BigDecimal.ZERO).fixedDiscountAmount(new BigDecimal("10000"))
                .minimumOrderValue(BigDecimal.ZERO).usageLimit(1).build());
        return createdVoucher;
    }
    private void quote(String fee) {
        when(carrier.quote(anyList(), eq(address), anyString(), anyString()))
                .thenReturn(new CarrierShippingQuote(new BigDecimal(fee), "12 Street, Ward, Province"));
    }
    private CheckoutPreviewRequest preview(String shipCode) {
        return new CheckoutPreviewRequest(null, shipCode, List.of(selected), address, customer.getFullName(), "0900000000");
    }
    private PlaceOrderRequest request(String shipCode, String fee) {
        return new PlaceOrderRequest(customer.getFullName(), "0900000000", customer.getEmail(), "Untrusted client address",
                "COD", null, null, shipCode, List.of(selected), address, new BigDecimal(fee));
    }
}
