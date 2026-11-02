package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest @Transactional
class CommercePricingIntegrationTest {
    @Autowired CartService cartService;
    @Autowired OrderService orderService;
    @Autowired PosService posService;
    @Autowired VoucherService voucherService;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired InventoryRepository inventories;
    @Autowired ProductPromotionRepository promotions;
    @Autowired ShippingSettingsRepository shippingSettings;
    @Autowired VoucherRepository vouchers;
    Product product;
    User customer;
    String suffix;

    @BeforeEach void setUp() {
        suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        customer = users.save(User.builder().email("pricing-" + suffix + "@example.test").fullName("Khách kiểm thử giá")
                .password("unused-test-hash").role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        product = products.save(Product.builder().code("PRICE-" + suffix).name("Sản phẩm kiểm thử giá")
                .price(new BigDecimal("1000")).billableWeightKg(new BigDecimal("2.5")).bulkySurcharge(new BigDecimal("100"))
                .category(categories.findAll().getFirst()).build());
        inventories.save(Inventory.builder().product(product).quantity(10).build());
        shippingSettings.ensureDefaultSettings();
        var settings = shippingSettings.findById(1L).orElseThrow();
        settings.setEnabled(true); settings.setRatePerKg(new BigDecimal("100"));
        settings.setFreeShippingEnabled(false); settings.setFreeShippingThreshold(null);
        shippingSettings.saveAndFlush(settings);
        authenticate(customer.getEmail());
    }
    @AfterEach void clean() { SecurityContextHolder.clearContext(); }

    @Test void onlinePricingSeparatesProductOrderAndShippingSavingsAndPersistsSnapshots() {
        promotions.save(ProductPromotion.builder().product(product).name("Giảm sản phẩm")
                .discountRate(new BigDecimal("0.20")).isActive(true).build());
        var manual = savePriceVoucher("MANUAL", new BigDecimal("0.10"));
        var shipping = saveShippingVoucher(500);
        var cart = cartService.addToCart(new AddToCartRequest(product.getId(), 2));
        assertThat(cart.totalAmount()).isEqualByComparingTo("1600");
        assertThat(cart.originalTotalAmount()).isEqualByComparingTo("2000");
        assertThat(cart.productDiscountAmount()).isEqualByComparingTo("400");
        var preview = orderService.previewCheckout(new CheckoutPreviewRequest(manual.getCode(), shipping.getCode()));
        assertThat(preview.manualDiscountAmount()).isEqualByComparingTo("160");
        assertThat(preview.baseShippingFee()).isEqualByComparingTo("700");
        assertThat(preview.shippingDiscountAmount()).isEqualByComparingTo("500");
        assertThat(preview.shippingFee()).isEqualByComparingTo("200");
        assertThat(preview.finalAmount()).isEqualByComparingTo("1640");
        assertThat(shipping.getUsedCount()).isZero();
        var placed = orderService.placeOrder(request(manual.getCode(), shipping.getCode()));
        assertThat(placed.finalAmount()).isEqualByComparingTo(preview.finalAmount());
        assertThat(placed.shippingVoucherCode()).isEqualTo(shipping.getCode());
        assertThat(shipping.getUsedCount()).isEqualTo(1);
        assertThat(inventories.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(10);
        product.setPrice(new BigDecimal("9999")); products.save(product);
        promotions.findAll().stream().filter(p -> p.getProduct().getId().equals(product.getId())).forEach(p -> p.setActive(false));
        var settings = shippingSettings.findById(1L).orElseThrow(); settings.setRatePerKg(new BigDecimal("900"));
        var detail = orderService.getMyOrderDetail(placed.id());
        assertThat(detail.originalTotalAmount()).isEqualByComparingTo("2000");
        assertThat(detail.finalAmount()).isEqualByComparingTo("1640");
        assertThat(detail.items().getFirst().price()).isEqualByComparingTo("800");
        assertThat(detail.items().getFirst().originalUnitPrice()).isEqualByComparingTo("1000");
        orderService.customerCancelOrder(placed.id(), "Kiểm thử");
        assertThat(shipping.getUsedCount()).isZero();
        assertThatThrownBy(() -> orderService.customerCancelOrder(placed.id(), "Hủy lần hai")).isInstanceOf(IllegalArgumentException.class);
        assertThat(shipping.getUsedCount()).isZero();
    }

    @Test void freeshipThresholdWinsWithoutConsumingEnteredShippingVoucher() {
        var settings = shippingSettings.findById(1L).orElseThrow();
        settings.setFreeShippingEnabled(true); settings.setFreeShippingThreshold(new BigDecimal("2000"));
        var shipping = saveShippingVoucher(500);
        cartService.addToCart(new AddToCartRequest(product.getId(), 2));
        var preview = orderService.previewCheckout(new CheckoutPreviewRequest(null, shipping.getCode()));
        assertThat(preview.freeShippingApplied()).isTrue();
        assertThat(preview.shippingFee()).isZero();
        assertThat(preview.shippingVoucherApplied()).isFalse();
        assertThat(preview.shippingVoucherMessage()).contains("miễn phí");
        var order = orderService.placeOrder(request(null, shipping.getCode()));
        assertThat(order.shippingVoucherCode()).isNull();
        assertThat(shipping.getUsedCount()).isZero();
        assertThat(order.finalAmount()).isEqualByComparingTo("2000");
    }

    @Test void shippingVoucherCapsAtFeeAndPosRejectsItsUseAsPriceVoucher() {
        var shipping = saveShippingVoucher(9999);
        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        var preview = orderService.previewCheckout(new CheckoutPreviewRequest(null, shipping.getCode()));
        assertThat(preview.shippingDiscountAmount()).isEqualByComparingTo("350");
        assertThat(preview.shippingFee()).isZero();
        authenticate("pos@m4n.vn");
        assertThatThrownBy(() -> posService.finalizeSale(PosSaleRequest.builder().items(List.of(new PosSaleItemRequest(product.getId(), 1)))
                .paymentMethod("BANK_TRANSFER").voucherCode(shipping.getCode()).build())).isInstanceOf(IllegalArgumentException.class);
        assertThat(inventories.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(10);
        assertThat(shipping.getUsedCount()).isZero();
    }

    @Test void posUsesProductPromotionAndStoresChargedAndOriginalPricesWithoutWeightOrShipping() {
        product.setBillableWeightKg(null);
        promotions.save(ProductPromotion.builder().product(product).name("Khuyến mãi POS").discountRate(new BigDecimal("0.25")).isActive(true).build());
        authenticate("pos@m4n.vn");
        var preview = posService.previewSale(PosSalePreviewRequest.builder().items(List.of(new PosSaleItemRequest(product.getId(), 2))).build());
        assertThat(preview.getSubtotal()).isEqualByComparingTo("1500");
        assertThat(preview.getProductDiscountAmount()).isEqualByComparingTo("500");
        assertThat(preview.getShippingFee()).isZero();
        var sale = posService.finalizeSale(PosSaleRequest.builder().items(List.of(new PosSaleItemRequest(product.getId(), 2))).paymentMethod("BANK_TRANSFER").build());
        assertThat(sale.getOriginalTotalAmount()).isEqualByComparingTo("2000");
        assertThat(sale.getFinalAmount()).isEqualByComparingTo("1500");
        product.setPrice(new BigDecimal("9999"));
        var stored = posService.getInvoiceById(sale.getInvoiceId(), "pos@m4n.vn");
        assertThat(stored.getItems().getFirst().getUnitPrice()).isEqualByComparingTo("750");
        assertThat(stored.getItems().getFirst().getOriginalUnitPrice()).isEqualByComparingTo("1000");
    }

    @Test void usedOrHistoricallyReferencedVoucherCannotChangeMeaningAfterCancellation() {
        var shipping = saveShippingVoucher(100);
        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        var placed = orderService.placeOrder(request(null, shipping.getCode()));
        orderService.customerCancelOrder(placed.id(), "Hủy");
        assertThat(shipping.getUsedCount()).isZero();
        assertThatThrownBy(() -> voucherService.updateVoucher(shipping.getId(), new UpdateVoucherRequest(new BigDecimal("0.1"),
                BigDecimal.ZERO, true, null, null, null, null, PromotionType.MANUAL, null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("đổi loại");
    }

    @Test void adminVoucherFiltersRunBeforePagingAndRejectUnknownState() {
        saveShippingVoucher(100);
        var manual = savePriceVoucher("MANUAL", new BigDecimal("0.1"));
        manual.setActive(false);
        var active = voucherService.searchVouchers(suffix, PromotionType.SHIPPING, null, "ACTIVE", PageRequest.of(0, 1, Sort.by("id")));
        assertThat(active.getTotalElements()).isEqualTo(1);
        assertThat(active.getContent().getFirst().promotionType()).isEqualTo(PromotionType.SHIPPING);
        var inactive = voucherService.searchVouchers(suffix, null, null, "INACTIVE", PageRequest.of(0, 1));
        assertThat(inactive.getTotalElements()).isEqualTo(1);
        assertThat(inactive.getContent().getFirst().id()).isEqualTo(manual.getId());
        assertThatThrownBy(() -> voucherService.searchVouchers(null, null, null, "BAD", PageRequest.of(0, 1))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void invalidShippingCodeCannotCreateAnOrderOrConsumeAnyUsage() {
        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        var preview = orderService.previewCheckout(new CheckoutPreviewRequest(null, "MISSING-" + suffix));
        assertThat(preview.shippingVoucherApplied()).isFalse();
        assertThat(preview.shippingVoucherMessage()).contains("không tồn tại");
        assertThatThrownBy(() -> orderService.placeOrder(request(null, "MISSING-" + suffix)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("không tồn tại");
    }

    @Test void oversizedCartMultiplicationReturnsSafeValidationFailure() {
        product.setPrice(new BigDecimal("999999999999.99")); products.saveAndFlush(product);
        assertThatThrownBy(() -> cartService.addToCart(new AddToCartRequest(product.getId(), 2)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("giới hạn");
    }

    private Voucher saveShippingVoucher(int amount) {
        return vouchers.save(Voucher.builder().code("SHIP-" + suffix).promotionType(PromotionType.SHIPPING).discountRate(BigDecimal.ZERO)
                .fixedDiscountAmount(BigDecimal.valueOf(amount)).minimumOrderValue(BigDecimal.ZERO).usageLimit(2).build());
    }
    private Voucher savePriceVoucher(String prefix, BigDecimal rate) {
        return vouchers.save(Voucher.builder().code(prefix + "-" + suffix).discountRate(rate).minimumOrderValue(BigDecimal.ZERO).build());
    }
    private PlaceOrderRequest request(String priceCode, String shippingCode) {
        return new PlaceOrderRequest("Khách kiểm thử", "0900000000", customer.getEmail(), "Địa chỉ kiểm thử", "COD", priceCode, null, shippingCode);
    }
    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(email, null, List.of()));
    }
}
