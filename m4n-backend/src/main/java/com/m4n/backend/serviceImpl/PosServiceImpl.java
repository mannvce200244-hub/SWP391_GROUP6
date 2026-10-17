package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosProductResponse;
import com.m4n.backend.dto.response.PosSalePreviewResponse;
import com.m4n.backend.dto.response.PosSaleResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.InvoiceItem;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.InsufficientStockException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.PosService;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PosServiceImpl implements PosService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Locale VN_LOCALE = Locale.of("vi", "VN");

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;

    @Override
    @Transactional(readOnly = true)
    public List<PosProductResponse> searchProducts(String keyword) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        List<Product> products = productRepository.searchPosProducts(cleanKeyword, PageRequest.of(0, 40)).getContent();

        return products.stream()
                .map(this::mapToPosProductResponse)
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

        return mapToPosProductResponse(product);
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

        for (Map.Entry<Long, Integer> entry : itemQuantities.entrySet()) {
            Long productId = entry.getKey();
            int qty = entry.getValue();

            Product product = productRepository.findByIdAndIsActiveTrue(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: " + productId));

            BigDecimal price = product.getPrice();
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);

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
                    .formattedPrice(formatVnd(price))
                    .quantity(qty)
                    .lineTotal(lineTotal)
                    .formattedLineTotal(formatVnd(lineTotal))
                    .availableQuantity(availableQty)
                    .isSufficient(isSufficient)
                    .build());
        }

        BigDecimal discount = BigDecimal.ZERO;
        boolean voucherApplied = false;
        String voucherMessage = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            VoucherValidationResponse voucherResult = voucherService.validateAndCalculate(request.getVoucherCode(), subtotal);
            if (voucherResult.isValid()) {
                discount = voucherResult.discountAmount();
                voucherApplied = true;
                voucherMessage = voucherResult.message();
            } else {
                voucherMessage = voucherResult.message();
            }
        }

        BigDecimal finalAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);

        return PosSalePreviewResponse.builder()
                .items(previewItems)
                .subtotal(subtotal)
                .formattedSubtotal(formatVnd(subtotal))
                .discount(discount)
                .formattedDiscount(formatVnd(discount))
                .finalAmount(finalAmount)
                .formattedFinalAmount(formatVnd(finalAmount))
                .voucherApplied(voucherApplied)
                .voucherMessage(voucherMessage)
                .stockWarnings(warnings)
                .build();
    }

    @Override
    @Transactional
    public PosSaleResponse finalizeSale(PosSaleRequest request) {
        User staff = getAuthenticatedStaff();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Hóa đơn POS phải có ít nhất một sản phẩm.");
        }

        Map<Long, Integer> consolidatedItems = consolidateItems(request.getItems());

        // 1. Reload authoritative products & prices from DB
        Map<Long, Product> productMap = new LinkedHashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
            Long productId = entry.getKey();
            int qty = entry.getValue();

            Product product = productRepository.findByIdAndIsActiveTrue(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: " + productId));

            productMap.put(productId, product);
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);
        }

        // 2. Authoritative Voucher Re-validation
        BigDecimal discount = BigDecimal.ZERO;
        String appliedVoucherCode = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            VoucherValidationResponse voucherResult = voucherService.validateAndCalculate(request.getVoucherCode(), subtotal);
            if (!voucherResult.isValid()) {
                throw new IllegalArgumentException("Mã giảm giá không hợp lệ tại thời điểm thanh toán: " + voucherResult.message());
            }
            discount = voucherResult.discountAmount();
            appliedVoucherCode = request.getVoucherCode().trim().toUpperCase();
        }

        BigDecimal finalAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);

        // 3. Payment Method & Cash Calculations
        String paymentMethod = request.getPaymentMethod().trim().toUpperCase();
        BigDecimal amountReceived;
        BigDecimal amountChange;

        if ("CASH".equals(paymentMethod)) {
            amountReceived = request.getAmountReceived() != null ? request.getAmountReceived() : finalAmount;
            if (amountReceived.compareTo(finalAmount) < 0) {
                throw new IllegalArgumentException("Số tiền khách đưa (" + formatVnd(amountReceived) + ") chưa đủ để thanh toán đơn (" + formatVnd(finalAmount) + ").");
            }
            amountChange = amountReceived.subtract(finalAmount);
        } else if ("BANK_TRANSFER".equals(paymentMethod)) {
            amountReceived = finalAmount;
            amountChange = BigDecimal.ZERO;
        } else {
            throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + request.getPaymentMethod() + ". Hỗ trợ: CASH, BANK_TRANSFER.");
        }

        // 4. CRITICAL: Acquire PESSIMISTIC_WRITE lock on ALL items' inventory
        // Invariant: BR-INVENTORY-03: quantity >= 0, ZERO partial deduction
        Map<Long, Inventory> lockedInventories = new HashMap<>();

        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
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
                .discount(discount)
                .finalAmount(finalAmount)
                .voucherCode(appliedVoucherCode)
                .paymentMethod(paymentMethod)
                .amountReceived(amountReceived)
                .amountChange(amountChange)
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .items(new ArrayList<>())
                .build();

        for (Map.Entry<Long, Integer> entry : consolidatedItems.entrySet()) {
            Long productId = entry.getKey();
            int qty = entry.getValue();
            Product product = productMap.get(productId);
            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(qty));

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .productName(product.getName())
                    .productCode(product.getCode())
                    .unitPrice(unitPrice)
                    .quantity(qty)
                    .lineAmount(lineAmount)
                    .build();

            invoice.getItems().add(item);
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("POS sale finalized successfully: Invoice [{}], finalAmount={}, itemsCount={}",
                savedInvoice.getInvoiceCode(), savedInvoice.getFinalAmount(), savedInvoice.getItems().size());

        return mapToPosSaleResponse(savedInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PosSaleResponse getInvoiceById(Long invoiceId) {
        Invoice invoice = invoiceRepository.findWithDetailsById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + invoiceId));
        return mapToPosSaleResponse(invoice);
    }

    private Map<Long, Integer> consolidateItems(List<PosSaleItemRequest> items) {
        Map<Long, Integer> consolidated = new LinkedHashMap<>();
        for (PosSaleItemRequest item : items) {
            if (item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Thông tin sản phẩm hoặc số lượng không hợp lệ.");
            }
            consolidated.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }
        return consolidated;
    }

    private PosProductResponse mapToPosProductResponse(Product product) {
        Inventory inventory = inventoryRepository.findByProductId(product.getId()).orElse(null);
        int qty = inventory != null ? inventory.getQuantity() : 0;

        String availability;
        if (qty > 5) {
            availability = "IN_STOCK";
        } else if (qty > 0) {
            availability = "LOW_STOCK";
        } else {
            availability = "OUT_OF_STOCK";
        }

        String primaryImage = null;
        if (product.getMedia() != null && !product.getMedia().isEmpty()) {
            primaryImage = product.getMedia().stream()
                    .map(ProductMedia::getUrl)
                    .findFirst()
                    .orElse(null);
        }

        return PosProductResponse.builder()
                .id(product.getId())
                .code(product.getCode())
                .barcode(product.getBarcode())
                .name(product.getName())
                .price(product.getPrice())
                .formattedPrice(formatVnd(product.getPrice()))
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
                .subtotal(invoice.getSubtotal())
                .formattedSubtotal(formatVnd(invoice.getSubtotal()))
                .discount(invoice.getDiscount())
                .formattedDiscount(formatVnd(invoice.getDiscount()))
                .finalAmount(invoice.getFinalAmount())
                .formattedFinalAmount(formatVnd(invoice.getFinalAmount()))
                .voucherCode(invoice.getVoucherCode())
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

    private String generateInvoiceCode() {
        int year = Year.now().getValue();
        int randomNum = 100000 + RANDOM.nextInt(900000);
        return "HD-" + year + "-" + randomNum;
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
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nhân viên."));
    }
}
