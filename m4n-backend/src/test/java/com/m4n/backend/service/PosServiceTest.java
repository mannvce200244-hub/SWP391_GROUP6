package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosProductResponse;
import com.m4n.backend.dto.response.PosSalePreviewResponse;
import com.m4n.backend.dto.response.PosSaleResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.dto.response.DiscountCalculationResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.InsufficientStockException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.serviceImpl.PosServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PosServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VoucherService voucherService;
    @Mock private InventoryService inventoryService;

    private PosService posService;

    private User staffUser;
    private Product productA;
    private Product productB;
    private Inventory inventoryA;
    private Inventory inventoryB;

    @Mock private ProductPricingService productPricingService;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient().when(productPricingService.resolvePrices(any())).thenAnswer(inv -> {
            java.util.List<Product> requested = inv.getArgument(0);
            return requested.stream().collect(java.util.stream.Collectors.toMap(Product::getId,
                    product -> new ProductPrice(product.getPrice(), product.getPrice(), BigDecimal.ZERO, null), (first, duplicate) -> first));
        });

        posService = new PosServiceImpl(
                productRepository,
                inventoryRepository,
                invoiceRepository,
                userRepository,
                voucherService, inventoryService, productPricingService
        );
        lenient().when(voucherService.consumeDiscounts(any(), any(), anyInt())).thenAnswer(invocation ->
                new DiscountCalculationResponse(null, null, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, invocation.getArgument(1)));

        Role posStaffRole = Role.builder().id(3L).name(RoleName.POS_STAFF).build();
        staffUser = User.builder()
                .id(5L)
                .email("pos@m4n.vn")
                .fullName("Thu Ngân Showroom")
                .role(posStaffRole)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("pos@m4n.vn", "password", List.of())
        );

        Category category = Category.builder().id(1L).name("Nhạc cụ dây").build();

        productA = Product.builder()
                .id(1L)
                .code("TRN-001")
                .barcode("8938500000018")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .category(category)
                .media(new ArrayList<>())
                .isActive(true)
                .build();

        productB = Product.builder()
                .id(2L)
                .code("BAU-001")
                .barcode("8938500000025")
                .name("Đàn Bầu Gỗ Mun")
                .price(new BigDecimal("6200000"))
                .category(category)
                .media(new ArrayList<>())
                .isActive(true)
                .build();

        inventoryA = Inventory.builder()
                .id(11L)
                .product(productA)
                .quantity(5)
                .updatedAt(Instant.now())
                .build();

        inventoryB = Inventory.builder()
                .id(12L)
                .product(productB)
                .quantity(3)
                .updatedAt(Instant.now())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("lookupBarcode should return product when found by barcode or code")
    void shouldLookupBarcodeSuccessfully() {
        when(productRepository.findByCodeOrBarcode("8938500000018")).thenReturn(Optional.of(productA));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventoryA));

        PosProductResponse response = posService.lookupBarcode("8938500000018");

        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("TRN-001");
        assertThat(response.getName()).isEqualTo("Đàn Tranh 16 Dây");
        assertThat(response.getQuantity()).isEqualTo(5);
        assertThat(response.getAvailability()).isEqualTo("LOW_STOCK");
    }

    @Test
    @DisplayName("previewSale should calculate authoritative line amounts, subtotal, and voucher")
    void shouldPreviewSaleWithVoucher() {
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(productA));
        when(productRepository.findByIdAndIsActiveTrue(2L)).thenReturn(Optional.of(productB));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventoryA));
        when(inventoryRepository.findByProductId(2L)).thenReturn(Optional.of(inventoryB));

        // Subtotal = 8,500,000 * 1 + 6,200,000 * 1 = 14,700,000
        BigDecimal subtotal = new BigDecimal("14700000");
        BigDecimal discount = new BigDecimal("1470000");
        BigDecimal finalAmount = new BigDecimal("13230000");

        when(voucherService.calculateDiscounts(eq("M4N10"), eq(subtotal), eq(2)))
                .thenReturn(new DiscountCalculationResponse(new VoucherValidationResponse(
                        "M4N10", new BigDecimal("0.10"), BigDecimal.ZERO,
                        discount, "1.470.000 ₫", finalAmount, "13.230.000 ₫",
                        true, "Áp dụng thành công"
                ), null, discount, BigDecimal.ZERO, discount, finalAmount));

        PosSalePreviewRequest request = PosSalePreviewRequest.builder()
                .items(List.of(
                        new PosSaleItemRequest(1L, 1),
                        new PosSaleItemRequest(2L, 1)
                ))
                .voucherCode("M4N10")
                .build();

        PosSalePreviewResponse response = posService.previewSale(request);

        assertThat(response).isNotNull();
        assertThat(response.getSubtotal()).isEqualByComparingTo(subtotal);
        assertThat(response.getDiscount()).isEqualByComparingTo(discount);
        assertThat(response.getFinalAmount()).isEqualByComparingTo(finalAmount);
        assertThat(response.isVoucherApplied()).isTrue();
        assertThat(response.getItems()).hasSize(2);
    }

    @Test
    @DisplayName("finalizeSale should atomically deduct inventory and persist Invoice with historical snapshots (BR-POS-01)")
    void shouldFinalizeSaleSuccessfully() {
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(staffUser));
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(productA));
        when(productRepository.findByIdAndIsActiveTrue(2L)).thenReturn(Optional.of(productB));
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventoryA));
        when(inventoryRepository.findByProductIdWithLock(2L)).thenReturn(Optional.of(inventoryB));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(500L);
            return inv;
        });

        // Subtotal: 8,500,000 + 6,200,000 = 14,700,000
        PosSaleRequest request = PosSaleRequest.builder()
                .items(List.of(
                        new PosSaleItemRequest(1L, 1),
                        new PosSaleItemRequest(2L, 1)
                ))
                .paymentMethod("CASH")
                .amountReceived(new BigDecimal("15000000"))
                .customerName("Nguyễn Văn A")
                .build();

        PosSaleResponse response = posService.finalizeSale(request);

        assertThat(response).isNotNull();
        assertThat(response.getInvoiceId()).isEqualTo(500L);
        assertThat(response.getInvoiceCode()).startsWith("HD-");
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("14700000"));
        assertThat(response.getFinalAmount()).isEqualByComparingTo(new BigDecimal("14700000"));
        assertThat(response.getAmountReceived()).isEqualByComparingTo(new BigDecimal("15000000"));
        // Change: 15,000,000 - 14,700,000 = 300,000
        assertThat(response.getAmountChange()).isEqualByComparingTo(new BigDecimal("300000"));

        // Verify inventory deducted atomically
        assertThat(inventoryA.getQuantity()).isEqualTo(4); // 5 - 1
        assertThat(inventoryB.getQuantity()).isEqualTo(2); // 3 - 1
        verify(inventoryRepository).save(inventoryA);
        verify(inventoryRepository).save(inventoryB);
        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    @DisplayName("finalizeSale should reject transaction when any item has insufficient stock without partial deduction (BR-INVENTORY-03)")
    void shouldRejectWhenInsufficientStock() {
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(staffUser));
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(productA));
        when(productRepository.findByIdAndIsActiveTrue(2L)).thenReturn(Optional.of(productB));

        // Inventory B has only 3, but request asks for 5
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventoryA));
        when(inventoryRepository.findByProductIdWithLock(2L)).thenReturn(Optional.of(inventoryB));

        PosSaleRequest request = PosSaleRequest.builder()
                .items(List.of(
                        new PosSaleItemRequest(1L, 1),
                        new PosSaleItemRequest(2L, 5) // exceeds 3!
                ))
                .paymentMethod("BANK_TRANSFER")
                .build();

        assertThatThrownBy(() -> posService.finalizeSale(request))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("không đủ tồn kho tại showroom");

        // Verify inventory A was NOT deducted (zero partial deduction)
        assertThat(inventoryA.getQuantity()).isEqualTo(5);
        assertThat(inventoryB.getQuantity()).isEqualTo(3);
        verify(inventoryRepository, never()).save(any(Inventory.class));
        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    @Test
    @DisplayName("finalizeSale should reject cash payment when amount received is less than final amount")
    void shouldRejectWhenCashReceivedInsufficient() {
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(staffUser));
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(productA));
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventoryA));

        // Subtotal: 8,500,000, Cash received: 5,000,000
        PosSaleRequest request = PosSaleRequest.builder()
                .items(List.of(new PosSaleItemRequest(1L, 1)))
                .paymentMethod("CASH")
                .amountReceived(new BigDecimal("5000000"))
                .build();

        assertThatThrownBy(() -> posService.finalizeSale(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chưa đủ để thanh toán đơn");

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("POS staff cannot retrieve an invoice created by another cashier")
    void invoiceAccess_foreignPosStaff_throwsAccessDenied() {
        User otherCashier = User.builder()
                .id(6L)
                .email("pos2@m4n.vn")
                .role(Role.builder().id(3L).name(RoleName.POS_STAFF).build())
                .build();
        Invoice invoice = Invoice.builder().id(500L).staff(otherCashier).build();
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn"))
                .thenReturn(Optional.of(staffUser));
        when(invoiceRepository.findWithDetailsById(500L)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> posService.assertCanAccessInvoice(500L, "pos@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("không có quyền truy cập hóa đơn này");
    }

    @Test
    @DisplayName("POS staff can retrieve an invoice created by the same cashier")
    void invoiceAccess_owner_success() {
        Invoice invoice = Invoice.builder().id(500L).staff(staffUser).build();
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn"))
                .thenReturn(Optional.of(staffUser));
        when(invoiceRepository.findWithDetailsById(500L)).thenReturn(Optional.of(invoice));

        posService.assertCanAccessInvoice(500L, "pos@m4n.vn");

        verify(invoiceRepository).findWithDetailsById(500L);
    }

    @Test
    @DisplayName("POS staff invoice history is restricted to invoices created by that cashier")
    void listInvoices_posStaff_returnsOnlyOwnedInvoices() {
        Invoice ownedInvoice = Invoice.builder()
                .id(500L)
                .invoiceCode("HD-2026-500")
                .staff(staffUser)
                .customerName("Khách lẻ")
                .subtotal(new BigDecimal("8500000"))
                .discount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("8500000"))
                .paymentMethod("CASH")
                .amountReceived(new BigDecimal("8500000"))
                .amountChange(BigDecimal.ZERO)
                .createdAt(Instant.now())
                .items(new ArrayList<>())
                .build();
        PageRequest pageable = PageRequest.of(0, 15, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(staffUser));
        when(invoiceRepository.findByStaffId(staffUser.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(ownedInvoice), pageable, 1));

        var result = posService.listInvoices(null, pageable, "pos@m4n.vn");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getInvoiceCode()).isEqualTo("HD-2026-500");
        verify(invoiceRepository).findByStaffId(staffUser.getId(), pageable);
        verify(invoiceRepository, never()).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void invoiceListShouldRejectUnsupportedNestedSort() {
        assertThatThrownBy(() -> posService.listInvoices(null,
                PageRequest.of(0, 10, Sort.by("staff.password")), "pos@m4n.vn"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("sắp xếp");
        verify(userRepository, never()).findByEmailIgnoreCase(any());
        verify(invoiceRepository, never()).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void previewSaleRejectsDuplicateQuantityOverflowBeforeStockOrPriceCalculation() {
        PosSalePreviewRequest request = PosSalePreviewRequest.builder().items(List.of(
                new PosSaleItemRequest(1L, Integer.MAX_VALUE), new PosSaleItemRequest(1L, 1))).build();

        assertThatThrownBy(() -> posService.previewSale(request)).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vượt quá giới hạn");
        verify(inventoryRepository, never()).save(any());
    }
}
