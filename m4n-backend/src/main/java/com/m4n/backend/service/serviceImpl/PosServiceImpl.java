package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosProductResponse;
import com.m4n.backend.dto.response.PosSalePreviewResponse;
import com.m4n.backend.dto.response.PosSaleResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.dto.response.DiscountCalculationResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.InventoryMovement;
import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.InvoiceItem;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.InsufficientStockException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.PosMomoPaymentRepository;
import com.m4n.backend.entity.PaymentState;
import com.m4n.backend.entity.RefundState;
import tools.jackson.databind.ObjectMapper;
import com.m4n.backend.service.PosService;
import com.m4n.backend.service.PosCustomerService;
import com.m4n.backend.service.InventoryService;
import com.m4n.backend.service.ProductPricingService;
import com.m4n.backend.service.ProductPrice;
import com.m4n.backend.validation.MoneyValidation;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PosServiceImpl implements PosService {

    private static final Locale VN_LOCALE = Locale.of("vi", "VN");

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;
    private final InventoryService inventoryService;
    private final ProductPricingService productPricingService;
    private final PosMomoPaymentRepository momoPayments;
    private final ObjectMapper json;
    private final PosCustomerService posCustomerService;

    @Override
    @Transactional(readOnly = true)
    public List<PosProductResponse> searchProducts(String keyword) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        List<Product> products = productRepository.searchPosProducts(cleanKeyword, PageRequest.of(0, 40)).getContent();

        Map<Long, ProductPrice> prices = productPricingService.resolvePrices(products);
        return products.stream()
                .map(product -> mapToPosProductResponse(product, prices.get(product.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PosProductResponse lookupBarcode(String codeOrBarcode) {
        if (codeOrBarcode == null || codeOrBarcode.isBlank()) {
            throw new IllegalArgumentException("Mã barcode hoặc mã sản phẩm không được để trống");
        }

        Product product = productRepository.findByCodeOrBarcode(codeOrBarcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với mã này: " + codeOrBarcode));

        return mapToPosProductResponse(product, productPricingService.resolvePrices(List.of(product)).get(product.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public PosSalePreviewResponse previewSale(PosSalePreviewRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Danh sách sản phẩm không được để trống");
        }

        Map<Long, Integer> itemQuantities = consolidateItems(request.getItems());
        List<PosSalePreviewResponse.PreviewItem> previewItems = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal originalTotal = BigDecimal.ZERO;
        Map<Long, Product> products = loadSellableProducts(itemQuantities);
        Map<Long, ProductPrice> prices = productPricingService.resolvePrices(new ArrayList<>(products.values()));

        for (Map.Entry<Long, Integer> entry : itemQuantities.entrySet()) {
            Long productId = entry.getKey();
            int qty = entry.getValue();

            Product product = products.get(productId);
            ProductPrice pricing = prices.get(productId);

            BigDecimal price = pricing.chargedUnitPrice();
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);
            originalTotal = originalTotal.add(pricing.originalUnitPrice().multiply(BigDecimal.valueOf(qty)));

            Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
            int availableQty = inventory != null ? inventory.getQuantity() : 0;
            boolean isSufficient = availableQty >= qty;

            if (!isSufficient) {
                warnings.add(String.format("Sản phẩm '%s' hiện chỉ còn %d trong kho (yêu cầu: %d).",
                        product.getName(), availableQty, qty));
            }

            previewItems.add(PosSalePreviewResponse.PreviewItem.builder()
                    .productId(product.getId())
                    .productCode(product.getCode())
                    .productName(product.getName())
                    .price(price)
                    .originalUnitPrice(pricing.originalUnitPrice())
                    .productDiscountAmount(pricing.productDiscountAmount())
                    .formattedPrice(formatVnd(price))
                    .quantity(qty)
                    .lineTotal(lineTotal)
                    .formattedLineTotal(formatVnd(lineTotal))
                    .availableQuantity(availableQty)
                    .isSufficient(isSufficient)
                    .build());
        }

        MoneyValidation.requireSupported(originalTotal);
        MoneyValidation.requireSupported(subtotal);

        int totalQuantity = itemQuantities.values().stream().reduce(0, Math::addExact);
        DiscountCalculationResponse discounts = voucherService.calculateDiscounts(request.getVoucherCode(), subtotal, totalQuantity);
        VoucherValidationResponse manual = discounts.manualVoucher();
        BigDecimal discount = discounts.totalDiscountAmount();
        BigDecimal finalAmount = discounts.finalAmount();

        MoneyValidation.requireSupported(finalAmount);
        return PosSalePreviewResponse.builder()
                .items(previewItems)
                .shippingFee(BigDecimal.ZERO)
                .subtotal(subtotal)
                .originalTotalAmount(originalTotal)
                .productDiscountAmount(originalTotal.subtract(subtotal))
                .formattedSubtotal(formatVnd(subtotal))
                .discount(discount)
                .formattedDiscount(formatVnd(discount))
                .finalAmount(finalAmount)
                .formattedFinalAmount(formatVnd(finalAmount))
                .voucherApplied(manual != null && manual.isValid())
                .voucherMessage(manual != null ? manual.message() : null)
                .manualDiscountAmount(discounts.manualDiscountAmount())
                .automaticDiscountAmount(discounts.automaticDiscountAmount())
                .automaticPromotionCode(discounts.automaticPromotion() != null ? discounts.automaticPromotion().code() : null)
                .stockWarnings(warnings)
                .build();
    }

    @Override
    @Transactional
    public PosSaleResponse finalizeSale(PosSaleRequest request) {
        User staff = getAuthenticatedStaff();
        if (!Set.of("CASH", "BANK_TRANSFER").contains(request.getPaymentMethod().trim().toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("MoMo phải được xác minh qua cổng thanh toán trước khi xuất hóa đơn.");
        }
        return finalizeSale(request, staff, null);
    }

    @Override
    @Transactional
    public void completeMomoSale(String paymentId) {
        var payment = momoPayments.findByIdWithLock(paymentId).orElseThrow();
        if (payment.isCancelRequested() || payment.getState() != PaymentState.SUCCEEDED || payment.getRefundState() != RefundState.NONE
                || payment.getInvoice() != null) return;
        PosSaleRequest request = json.readValue(payment.getBill(), PosSaleRequest.class);
        request.setPaymentMethod("MOMO");
        var sale = finalizeSale(request, payment.getStaff(), payment.getAmount());
        payment.setInvoice(invoiceRepository.getReferenceById(sale.getInvoiceId()));
        payment.setReceiptEmailQueuedAt(Instant.now());
    }

    private PosSaleResponse finalizeSale(PosSaleRequest request, User staff, BigDecimal verifiedAmount) {

        // Older persisted MoMo intents can contain a name-only guest snapshot.
        // New intents are validated before allocation and cannot enter this legacy path.
        boolean legacyGuest = verifiedAmount != null && request.getCustomerId() == null && request.getPosCustomerId() == null
                && (request.getCustomerPhone() == null || request.getCustomerPhone().isBlank());
        if (!legacyGuest) posCustomerService.validateCustomer(request);

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Hóa đơn POS phải có ít nhất một sản phẩm.");
        }

        Map<Long, Integer> consolidatedItems = consolidateItems(request.getItems());

        // 1. Reload authoritative products & prices from DB
        Map<Long, Product> productMap = loadSellableProducts(consolidatedItems);
        Map<Long, ProductPrice> prices = productPricingService.resolvePrices(new ArrayList<>(productMap.values()));
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal originalTotal = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
            Long productId = entry.getKey();
            int qty = entry.getValue();

            ProductPrice pricing = prices.get(productId);
            BigDecimal lineTotal = pricing.chargedUnitPrice().multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);
            originalTotal = originalTotal.add(pricing.originalUnitPrice().multiply(BigDecimal.valueOf(qty)));
        }
        MoneyValidation.requireSupported(originalTotal);
        MoneyValidation.requireSupported(subtotal);

        // 2. Acquire all inventory locks before voucher locks.
        // Locked in ascending productId order for deterministic lock ordering so two
        // concurrent sales with overlapping baskets cannot deadlock (BR-INVENTORY-03).
        Map<Long, Inventory> lockedInventories = new HashMap<>();

        List<Map.Entry<Long, Integer>> itemsInLockOrder = consolidatedItems.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .toList();

        for (Map.Entry<Long, Integer> entry : itemsInLockOrder) {
            Long productId = entry.getKey();
            int requestedQty = entry.getValue();

            Inventory inventory = inventoryRepository.findByProductIdWithLock(productId).orElse(null);
            int availableQty = inventory != null ? inventory.getQuantity() : 0;

            if (inventory == null || availableQty < requestedQty) {
                Product p = productMap.get(productId);
                log.warn("POS sale rejected due to insufficient stock: [{}] {} (requested: {}, available: {})",
                        p.getCode(), p.getName(), requestedQty, availableQty);
                throw new InsufficientStockException(String.format(
                        "Sản phẩm '%s' không đủ tồn kho tại showroom (Yêu cầu: %d, Hiện có: %d). Toàn bộ giao dịch bị hủy bỏ, chưa trừ kho.",
                        p.getName(), requestedQty, availableQty
                ));
            }

            lockedInventories.put(productId, inventory);
        }

        // Match confirmed-order cancellation: inventory locks precede voucher locks.
        int totalQuantity = consolidatedItems.values().stream().reduce(0, Math::addExact);
        DiscountCalculationResponse discounts = voucherService.consumeDiscounts(request.getVoucherCode(), subtotal, totalQuantity);
        BigDecimal discount = discounts.totalDiscountAmount();
        BigDecimal finalAmount = discounts.finalAmount();
        if (verifiedAmount != null && finalAmount.compareTo(verifiedAmount) != 0) {
            throw new IllegalStateException("Giá hoặc ưu đãi đã thay đổi trong lúc thanh toán POS.");
        }
        String appliedVoucherCode = discounts.manualVoucher() != null ? discounts.manualVoucher().code() : null;

        // 3. Apply authoritative discounts and validate payment before deduction.
        String paymentMethod = request.getPaymentMethod().trim().toUpperCase(Locale.ROOT);
        BigDecimal amountReceived;
        BigDecimal amountChange;

        if ("CASH".equals(paymentMethod)) {
            amountReceived = request.getAmountReceived() != null ? request.getAmountReceived() : finalAmount;
            if (amountReceived.compareTo(finalAmount) < 0) {
                throw new IllegalArgumentException("Số tiền khách đưa (" + formatVnd(amountReceived) + ") chưa đủ để thanh toán đơn (" + formatVnd(finalAmount) + ").");
            }
            amountChange = amountReceived.subtract(finalAmount);
        } else if ("BANK_TRANSFER".equals(paymentMethod) || "MOMO".equals(paymentMethod) && verifiedAmount != null) {
            amountReceived = finalAmount;
            amountChange = BigDecimal.ZERO;
        } else {
            throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + request.getPaymentMethod() + ". Hỗ trợ: CASH, BANK_TRANSFER.");
        }

        MoneyValidation.requireSupported(finalAmount);
        MoneyValidation.requireSupported(amountReceived);
        MoneyValidation.requireSupported(amountChange);

        // 5. ATOMIC DEDUCTION: All items are guaranteed sufficient
        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
            Long productId = entry.getKey();
            int requestedQty = entry.getValue();
            Inventory inventory = lockedInventories.get(productId);

            inventory.setQuantity(inventory.getQuantity() - requestedQty);
            inventory.setUpdatedAt(Instant.now());
            inventoryRepository.save(inventory);
        }

        // 6. Persist Authoritative Invoice and Historical Snapshots
        String invoiceCode = generateInvoiceCode();
        Invoice invoice = Invoice.builder()
                .invoiceCode(invoiceCode)
                .staff(staff)
                .customerName(request.getCustomerName() != null && !request.getCustomerName().isBlank() ? request.getCustomerName().trim() : "Khách lẻ tại quầy")
                .customerPhone(request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank() ? request.getCustomerPhone().trim() : null)
                .subtotal(subtotal)
                .originalTotalAmount(originalTotal)
                .productDiscountAmount(originalTotal.subtract(subtotal))
                .discount(discount)
                .manualDiscountAmount(discounts.manualDiscountAmount())
                .automaticDiscountAmount(discounts.automaticDiscountAmount())
                .automaticPromotionCode(discounts.automaticPromotion() != null ? discounts.automaticPromotion().code() : null)
                .finalAmount(finalAmount)
                .voucherCode(appliedVoucherCode)
                .paymentMethod(paymentMethod)
                .amountReceived(amountReceived)
                .amountChange(amountChange)
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .items(new ArrayList<>())
                .build();

        if (!legacyGuest) posCustomerService.attachCustomer(invoice, request);

        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
            Long productId = entry.getKey();
            int qty = entry.getValue();
            Product product = productMap.get(productId);
            ProductPrice pricing = prices.get(productId);
            BigDecimal unitPrice = pricing.chargedUnitPrice();
            BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(qty));

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .productName(product.getName())
                    .productCode(product.getCode())
                    .unitPrice(unitPrice)
                    .originalUnitPrice(pricing.originalUnitPrice())
                    .productPromotionId(pricing.productPromotionId())
                    .quantity(qty)
                    .lineAmount(lineAmount)
                    .build();

            invoice.getItems().add(item);
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
            Inventory inventory = lockedInventories.get(entry.getKey());
            inventoryService.recordMovement(InventoryMovement.builder().product(inventory.getProduct()).type("POS_SALE")
                    .quantity(entry.getValue()).quantityBefore(inventory.getQuantity() + entry.getValue())
                    .quantityAfter(inventory.getQuantity()).reason("Bán hàng tại quầy")
                    .sourceType("INVOICE").sourceId(savedInvoice.getId()).build());
        }
        log.info("POS sale finalized successfully: Invoice [{}], finalAmount={}, itemsCount={}",
                savedInvoice.getInvoiceCode(), savedInvoice.getFinalAmount(), savedInvoice.getItems().size());

        return mapToPosSaleResponse(savedInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PosSaleResponse getInvoiceById(Long invoiceId, String actorEmail) {
        assertCanAccessInvoice(invoiceId, actorEmail);
        Invoice invoice = invoiceRepository.findWithDetailsById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + invoiceId));
        return mapToPosSaleResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public void assertCanAccessInvoice(Long invoiceId, String actorEmail) {
        User actor = userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nhân viên."));
        Invoice invoice = invoiceRepository.findWithDetailsById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + invoiceId));
        RoleName actorRole = actor.getRole().getName();

        if (actorRole == RoleName.ADMIN || actorRole == RoleName.SUPER_ADMIN) {
            return;
        }
        if (actorRole != RoleName.POS_STAFF
                || invoice.getStaff() == null
                || !invoice.getStaff().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập hóa đơn này.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PosSaleResponse> listInvoices(String search, Pageable pageable, String actorEmail) {
        validateSort(pageable);
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        User actor = userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nhân viên."));
        RoleName actorRole = actor.getRole().getName();

        Page<Invoice> invoicePage;
        if (actorRole == RoleName.ADMIN || actorRole == RoleName.SUPER_ADMIN) {
            invoicePage = (trimmedSearch == null)
                    ? invoiceRepository.findAll(pageable)
                    : invoiceRepository.searchInvoices(trimmedSearch, pageable);
        } else if (actorRole == RoleName.POS_STAFF) {
            invoicePage = (trimmedSearch == null)
                    ? invoiceRepository.findByStaffId(actor.getId(), pageable)
                    : invoiceRepository.searchInvoicesByStaff(actor.getId(), trimmedSearch, pageable);
        } else {
            throw new AccessDeniedException("Bạn không có quyền xem lịch sử giao dịch POS.");
        }
        return invoicePage.map(this::mapToPosSaleResponse);
    }

    private void validateSort(Pageable pageable) {
        if (pageable.isPaged() && pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        Set<String> allowedProperties = Set.of("createdAt", "id", "invoiceCode", "finalAmount");
        if (pageable.getSort().stream().anyMatch(order -> !allowedProperties.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp hóa đơn không được hỗ trợ.");
        }
    }

    private Map<Long, Integer> consolidateItems(List<PosSaleItemRequest> items) {
        Map<Long, Integer> consolidated = new LinkedHashMap<>();
        long totalQuantity = 0;
        for (PosSaleItemRequest item : items) {
            if (item == null || item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Thông tin sản phẩm hoặc số lượng không hợp lệ.");
            }
            totalQuantity += item.getQuantity();
            if (totalQuantity > Integer.MAX_VALUE) {
                throw new IllegalArgumentException("Số lượng sản phẩm vượt quá giới hạn hỗ trợ.");
            }
            try {
                consolidated.merge(item.getProductId(), item.getQuantity(), Math::addExact);
            } catch (ArithmeticException exception) {
                throw new IllegalArgumentException("Số lượng sản phẩm vượt quá giới hạn hỗ trợ.");
            }
        }
        return consolidated;
    }

    private PosProductResponse mapToPosProductResponse(Product product, ProductPrice pricing) {
        Inventory inventory = inventoryRepository.findByProductId(product.getId()).orElse(null);
        int qty = inventory != null ? inventory.getQuantity() : 0;

        String availability;
        int threshold = product.getLowStockThreshold() == null ? 5 : product.getLowStockThreshold();
        if (qty > threshold) {
            availability = "IN_STOCK";
        } else if (qty > 0) {
            availability = "LOW_STOCK";
        } else {
            availability = "OUT_OF_STOCK";
        }

        String primaryImage = null;
        if (product.getMedia() != null && !product.getMedia().isEmpty()) {
            primaryImage = product.getMedia().stream()
                    .filter(media -> media.getMediaType() == MediaType.IMAGE)
                    .map(ProductMedia::getUrl)
                    .findFirst()
                    .orElse(null);
        }

        return PosProductResponse.builder()
                .id(product.getId())
                .code(product.getCode())
                .barcode(product.getBarcode())
                .name(product.getName())
                .price(pricing.chargedUnitPrice())
                .originalUnitPrice(pricing.originalUnitPrice())
                .productDiscountAmount(pricing.productDiscountAmount())
                .formattedPrice(formatVnd(pricing.chargedUnitPrice()))
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .primaryImage(primaryImage)
                .quantity(qty)
                .availability(availability)
                .build();
    }

    private PosSaleResponse mapToPosSaleResponse(Invoice invoice) {
        List<PosSaleResponse.SaleItemResponse> items = invoice.getItems().stream()
                .map(item -> PosSaleResponse.SaleItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productCode(item.getProductCode())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .originalUnitPrice(item.getOriginalUnitPrice() == null ? item.getUnitPrice() : item.getOriginalUnitPrice())
                        .productDiscountAmount(item.getOriginalUnitPrice() == null ? BigDecimal.ZERO : item.getOriginalUnitPrice().subtract(item.getUnitPrice()))
                        .formattedUnitPrice(formatVnd(item.getUnitPrice()))
                        .quantity(item.getQuantity())
                        .lineAmount(item.getLineAmount())
                        .formattedLineAmount(formatVnd(item.getLineAmount()))
                        .build())
                .toList();

        return PosSaleResponse.builder()
                .invoiceId(invoice.getId())
                .invoiceCode(invoice.getInvoiceCode())
                .staffName(invoice.getStaff() != null ? invoice.getStaff().getFullName() : "Nhân viên POS")
                .customerName(invoice.getCustomerName())
                .customerPhone(invoice.getCustomerPhone())
                .customerId(invoice.getCustomer() == null ? null : invoice.getCustomer().getId())
                .posCustomerId(invoice.getPosCustomer() == null ? null : invoice.getPosCustomer().getId())
                .subtotal(invoice.getSubtotal())
                .originalTotalAmount(invoice.getOriginalTotalAmount() == null ? invoice.getSubtotal() : invoice.getOriginalTotalAmount())
                .productDiscountAmount(invoice.getProductDiscountAmount() == null ? BigDecimal.ZERO : invoice.getProductDiscountAmount())
                .shippingFee(BigDecimal.ZERO)
                .formattedSubtotal(formatVnd(invoice.getSubtotal()))
                .discount(invoice.getDiscount())
                .formattedDiscount(formatVnd(invoice.getDiscount()))
                .finalAmount(invoice.getFinalAmount())
                .formattedFinalAmount(formatVnd(invoice.getFinalAmount()))
                .voucherCode(invoice.getVoucherCode())
                .manualDiscountAmount(invoice.getAutomaticPromotionCode() == null
                        ? invoice.getDiscount() : invoice.getManualDiscountAmount())
                .automaticDiscountAmount(invoice.getAutomaticDiscountAmount() == null
                        ? BigDecimal.ZERO : invoice.getAutomaticDiscountAmount())
                .automaticPromotionCode(invoice.getAutomaticPromotionCode())
                .paymentMethod(invoice.getPaymentMethod())
                .amountReceived(invoice.getAmountReceived())
                .formattedAmountReceived(formatVnd(invoice.getAmountReceived()))
                .amountChange(invoice.getAmountChange())
                .formattedAmountChange(formatVnd(invoice.getAmountChange()))
                .notes(invoice.getNotes())
                .createdAt(invoice.getCreatedAt())
                .items(items)
                .build();
    }

    private Map<Long, Product> loadSellableProducts(Map<Long, Integer> quantities) {
        Map<Long, Product> products = new LinkedHashMap<>();
        for (Long id : quantities.keySet()) {
            products.put(id, productRepository.findByIdAndIsActiveTrue(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: " + id)));
        }
        return products;
    }

    private String generateInvoiceCode() {
        int year = Year.now().getValue();
        return "HD-" + year + "-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 ₫";
        NumberFormat nf = NumberFormat.getInstance(VN_LOCALE);
        return nf.format(amount) + " ₫";
    }

    private User getAuthenticatedStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện bán hàng tại quầy.");
        }
        User staff = userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nhân viên."));
        if (staff.getRole().getName() != RoleName.POS_STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên POS mới có quyền hoàn tất giao dịch tại quầy.");
        }
        return staff;
    }
}
