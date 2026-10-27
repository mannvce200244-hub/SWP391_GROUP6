package com.m4n.backend.service;

import com.m4n.backend.dto.request.ConfirmStockDocumentRequest;
import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import com.m4n.backend.exception.InsufficientStockException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class StockDocumentIntegrationTest {
    @Autowired StockDocumentService stock;
    @Autowired InventoryService inventoryService;
    @Autowired PosService pos;
    @Autowired ProductRepository products;
    @Autowired InventoryRepository inventories;
    @Autowired StockDocumentRepository documents;
    @Autowired CategoryRepository categories;
    @Autowired InvoiceRepository invoices;
    @Autowired JdbcTemplate jdbc;
    Product product;
    final List<Long> invoiceIds = Collections.synchronizedList(new ArrayList<>());

    @BeforeEach void setUp() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        product = products.save(Product.builder().code("QC-" + suffix).name("Kiểm thử kho " + suffix)
                .price(new BigDecimal("1000")).category(categories.findAll().getFirst()).isActive(true).build());
        inventories.save(Inventory.builder().product(product).quantity(5).build());
        authenticateAdmin();
    }
    @AfterEach void clean() {
        SecurityContextHolder.clearContext();
        invoiceIds.forEach(invoices::deleteById);
        if (product != null) {
            jdbc.update("DELETE FROM inventory_movements WHERE product_id = ?", product.getId());
            jdbc.update("DELETE FROM stock_documents WHERE product_id = ?", product.getId());
            inventories.findByProductId(product.getId()).ifPresent(inventories::delete);
            products.deleteById(product.getId());
        }
    }

    @Test void receiptDraftAndPartialQcProduceOneAuditedStockIncrease() {
        var draft = stock.createReceipt(product.getId(), new StockImportRequest(7, "Lô mới"));
        assertThat(quantity()).isEqualTo(5);
        assertThat(movements().getTotalElements()).isZero();
        var confirmed = stock.confirm(draft.id(), new ConfirmStockDocumentRequest(2, "Dây hỏng"));
        assertThat(quantity()).isEqualTo(10);
        assertThat(confirmed.acceptedQuantity()).isEqualTo(5);
        assertThat(confirmed.rejectedQuantity()).isEqualTo(2);
        var audit = movements().getContent().getFirst();
        assertThat(audit.quantityBefore()).isEqualTo(5);
        assertThat(audit.quantityAfter()).isEqualTo(10);
        assertThat(audit.rejectionReason()).isEqualTo("Dây hỏng");
        assertThat(audit.sourceType()).isEqualTo("STOCK_DOCUMENT");
        assertThat(audit.sourceId()).isEqualTo(draft.id());
    }

    @Test void allRejectedGoodsNeverEnterSellableInventory() {
        var draft = stock.createReceipt(product.getId(), new StockImportRequest(7, null));
        stock.confirm(draft.id(), new ConfirmStockDocumentRequest(7, "Không đạt chất lượng"));
        assertThat(quantity()).isEqualTo(5);
        assertThat(movements().getContent().getFirst().quantity()).isZero();
        assertThat(movements().getContent().getFirst().rejectedQuantity()).isEqualTo(7);
    }

    @Test void failedQcInsufficientIssueAndOverflowRollbackAllSideEffects() {
        var receipt = stock.createReceipt(product.getId(), new StockImportRequest(1, null));
        assertThatThrownBy(() -> stock.confirm(receipt.id(), new ConfirmStockDocumentRequest(1, " ")))
                .isInstanceOf(IllegalArgumentException.class);
        var issue = stock.createIssue(product.getId(), new StockIssueRequest(6, "Hàng lỗi"));
        assertThatThrownBy(() -> stock.confirm(issue.id(), new ConfirmStockDocumentRequest(null, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(documents.findById(issue.id()).orElseThrow().getStatus()).isEqualTo(StockDocumentStatus.DRAFT);
        assertThat(quantity()).isEqualTo(5);
        var inventory = inventories.findByProductId(product.getId()).orElseThrow();
        inventory.setQuantity(Integer.MAX_VALUE);
        inventories.save(inventory);
        assertThatThrownBy(() -> stock.confirm(receipt.id(), new ConfirmStockDocumentRequest(null, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(quantity()).isEqualTo(Integer.MAX_VALUE);
        assertThat(documents.findById(receipt.id()).orElseThrow().getStatus()).isEqualTo(StockDocumentStatus.DRAFT);
        assertThat(movements().getTotalElements()).isZero();
    }

    @Test void simultaneousConfirmationAppliesExactlyOnce() throws Exception {
        var draft = stock.createReceipt(product.getId(), new StockImportRequest(3, null));
        var failures = race(() -> stock.confirm(draft.id(), new ConfirmStockDocumentRequest(null, null)),
                () -> stock.confirm(draft.id(), new ConfirmStockDocumentRequest(null, null)));
        assertThat(failures).hasSize(1);
        assertThat(failures.getFirst()).isInstanceOf(IllegalStateException.class);
        assertThat(quantity()).isEqualTo(8);
        assertThat(movements().getTotalElements()).isEqualTo(1);
    }

    @Test void simultaneousIssueAndPosShareOneAvailableUnitSafely() throws Exception {
        var inventory = inventories.findByProductId(product.getId()).orElseThrow();
        inventory.setQuantity(1);
        inventories.save(inventory);
        var issue = stock.createIssue(product.getId(), new StockIssueRequest(1, "Xuất kho"));
        var failures = race(() -> stock.confirm(issue.id(), new ConfirmStockDocumentRequest(null, null)), () -> {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("pos@m4n.vn", null,
                    List.of(new SimpleGrantedAuthority("ROLE_POS_STAFF"))));
            var sale = pos.finalizeSale(PosSaleRequest.builder().items(List.of(new PosSaleItemRequest(product.getId(), 1)))
                    .paymentMethod("BANK_TRANSFER").build());
            invoiceIds.add(sale.getInvoiceId());
        });
        assertThat(failures).hasSize(1);
        assertThat(failures.getFirst()).isInstanceOfAny(IllegalArgumentException.class, InsufficientStockException.class);
        assertThat(quantity()).isZero();
        assertThat(movements().getTotalElements()).isEqualTo(1);
        var movement = movements().getContent().getFirst();
        assertThat(movement.sourceType()).isEqualTo(invoiceIds.isEmpty() ? "STOCK_DOCUMENT" : "INVOICE");
        assertThat(movement.sourceId()).isEqualTo(invoiceIds.isEmpty() ? issue.id() : invoiceIds.getFirst());
    }

    @Test void documentsAndHistoryFilterBeforePagingAndPreserveSnapshots() {
        var first = stock.createReceipt(product.getId(), new StockImportRequest(2, null));
        stock.confirm(first.id(), new ConfirmStockDocumentRequest(null, null));
        var second = stock.createIssue(product.getId(), new StockIssueRequest(1, "Kiểm thử"));
        stock.confirm(second.id(), new ConfirmStockDocumentRequest(null, null));
        stock.createReceipt(product.getId(), new StockImportRequest(1, null));
        var confirmedReceipts = stock.list(product.getId(), StockDocumentType.RECEIPT, StockDocumentStatus.CONFIRMED,
                PageRequest.of(0, 1, Sort.by("id")));
        assertThat(confirmedReceipts.getTotalElements()).isEqualTo(1);
        assertThat(confirmedReceipts.getContent().getFirst().id()).isEqualTo(first.id());
        var receipts = inventoryService.listMovements(product.getId(), "RECEIPT", PageRequest.of(0, 1, Sort.by("id")));
        assertThat(receipts.getTotalElements()).isEqualTo(1);
        assertThat(receipts.getContent().getFirst().sourceId()).isEqualTo(first.id());
        String oldName = product.getName();
        product.setName("Đổi tên sau xác nhận");
        products.save(product);
        assertThat(movements().getContent()).allMatch(item -> oldName.equals(item.productName()));
        assertThat(stock.list(product.getId(), null, null, PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "id"))).getTotalElements()).isEqualTo(3);
        assertThatThrownBy(() -> inventoryService.listMovements(product.getId(), "BAD", PageRequest.of(0, 10))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> stock.list(null, null, null, PageRequest.of(0, 10, Sort.by("product.name")))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void posRoleCannotCreateOrConfirmStockDocuments() {
        var draft = stock.createReceipt(product.getId(), new StockImportRequest(2, null));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("pos@m4n.vn", null,
                List.of(new SimpleGrantedAuthority("ROLE_POS_STAFF"))));
        assertThatThrownBy(() -> stock.createIssue(product.getId(), new StockIssueRequest(1, "Sai quyền"))).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> stock.confirm(draft.id(), new ConfirmStockDocumentRequest(null, null))).isInstanceOf(AccessDeniedException.class);
        assertThat(quantity()).isEqualTo(5);
    }

    private int quantity() { return inventories.findByProductId(product.getId()).orElseThrow().getQuantity(); }
    private org.springframework.data.domain.Page<com.m4n.backend.dto.response.InventoryMovementResponse> movements() {
        return inventoryService.listMovements(product.getId(), null, PageRequest.of(0, 10, Sort.by("id")));
    }
    private void authenticateAdmin() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin@m4n.vn", null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }
    private List<Throwable> race(Runnable first, Runnable second) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        List<Throwable> failures = Collections.synchronizedList(new ArrayList<>());
        try {
            var futures = List.of(first, second).stream().map(action -> pool.submit(() -> {
                authenticateAdmin();
                ready.countDown();
                try { start.await(); action.run(); }
                catch (Throwable exception) { failures.add(exception); }
                finally { SecurityContextHolder.clearContext(); }
            })).toList();
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            for (var future : futures) future.get(15, TimeUnit.SECONDS);
            return failures;
        } finally { start.countDown(); pool.shutdownNow(); }
    }
}
