package com.m4n.backend.service;

import com.m4n.backend.dto.request.ConfirmStockDocumentRequest;
import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import com.m4n.backend.service.serviceImpl.StockDocumentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockDocumentServiceTest {
    @Mock StockDocumentRepository documents;
    @Mock ProductRepository products;
    @Mock InventoryRepository inventories;
    @Mock InventoryService inventoryService;
    StockDocumentService service;
    Product product;
    Inventory inventory;
    StockDocument document;

    @BeforeEach void setUp() {
        service = new StockDocumentServiceImpl(documents, products, inventories, inventoryService);
        product = Product.builder().id(10L).code("STOCK-TEST").name("Stock test").build();
        inventory = Inventory.builder().product(product).quantity(15).build();
        document = StockDocument.builder().id(7L).product(product).productCode(product.getCode())
                .productName(product.getName()).type(StockDocumentType.RECEIPT).status(StockDocumentStatus.DRAFT)
                .quantity(5).reason("Bổ sung hàng").createdBy("admin@test.vn").build();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin@test.vn", null, List.of()));
    }
    @AfterEach void clean() { SecurityContextHolder.clearContext(); }

    @Test void receiptCreationRecordsDraftWithoutReadingOrChangingInventory() {
        when(products.findById(10L)).thenReturn(Optional.of(product));
        when(documents.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var response = service.createReceipt(10L, new StockImportRequest(5, "  Bổ sung  "));
        assertThat(response.status()).isEqualTo(StockDocumentStatus.DRAFT);
        assertThat(response.reason()).isEqualTo("Bổ sung");
        assertThat(response.acceptedQuantity()).isNull();
        assertThat(response.createdBy()).isEqualTo("admin@test.vn");
        verifyNoInteractions(inventories, inventoryService);
    }

    @Test void invalidDraftQuantityAndBlankIssueReasonNeverPersist() {
        for (int quantity : new int[]{0, -1}) {
            assertThatThrownBy(() -> service.createReceipt(10L, new StockImportRequest(quantity, null)))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> service.createIssue(10L, new StockIssueRequest(quantity, "Sai số")))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> service.createIssue(10L, new StockIssueRequest(1, "  "))).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(documents, inventories, inventoryService);
    }

    @Test void partialRejectionAddsOnlyAcceptedGoodsAndAuditsQuality() {
        stubConfirmation();
        var result = service.confirm(7L, new ConfirmStockDocumentRequest(2, "  Hỏng dây  "));
        assertThat(result.acceptedQuantity()).isEqualTo(3);
        assertThat(result.rejectedQuantity()).isEqualTo(2);
        assertThat(result.rejectionReason()).isEqualTo("Hỏng dây");
        assertThat(result.quantityBefore()).isEqualTo(15);
        assertThat(result.quantityAfter()).isEqualTo(18);
        var captured = org.mockito.ArgumentCaptor.forClass(InventoryMovement.class);
        verify(inventoryService).recordMovement(captured.capture());
        assertThat(captured.getValue().getSourceId()).isEqualTo(7L);
        assertThat(captured.getValue().getSourceType()).isEqualTo("STOCK_DOCUMENT");
        assertThat(captured.getValue().getQuantity()).isEqualTo(3);
        assertThat(captured.getValue().getRejectedQuantity()).isEqualTo(2);
    }

    @Test void allRejectedReceiptRecordsQualityWithoutIncreasingStock() {
        stubConfirmation();
        var result = service.confirm(7L, new ConfirmStockDocumentRequest(5, "Hỏng toàn bộ"));
        assertThat(result.status()).isEqualTo(StockDocumentStatus.CONFIRMED);
        assertThat(result.acceptedQuantity()).isZero();
        assertThat(inventory.getQuantity()).isEqualTo(15);
        verify(inventoryService).recordMovement(any());
    }

    @Test void qcBoundsAndRequiredReasonFailBeforeLockingOrChangingStock() {
        when(documents.findByIdWithLock(7L)).thenReturn(Optional.of(document));
        for (var request : List.of(new ConfirmStockDocumentRequest(-1, "Bad"),
                new ConfirmStockDocumentRequest(6, "Bad"), new ConfirmStockDocumentRequest(1, "  "))) {
            assertThatThrownBy(() -> service.confirm(7L, request)).isInstanceOf(IllegalArgumentException.class);
        }
        verifyNoInteractions(inventories, products, inventoryService);
        assertThat(document.getStatus()).isEqualTo(StockDocumentStatus.DRAFT);
    }

    @Test void insufficientIssueLeavesDocumentDraftAndBalanceUnchanged() {
        document.setType(StockDocumentType.ISSUE);
        document.setQuantity(16);
        stubLockedStock();
        assertThatThrownBy(() -> service.confirm(7L, new ConfirmStockDocumentRequest(null, null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("không đủ");
        assertThat(document.getStatus()).isEqualTo(StockDocumentStatus.DRAFT);
        assertThat(inventory.getQuantity()).isEqualTo(15);
        verify(inventories, never()).save(any());
        verifyNoInteractions(inventoryService);
    }

    @Test void validIssueDeductsFullQuantityAndRejectsQualityFields() {
        document.setType(StockDocumentType.ISSUE);
        stubConfirmation();
        var result = service.confirm(7L, new ConfirmStockDocumentRequest(null, null));
        assertThat(result.quantityAfter()).isEqualTo(10);
        assertThat(result.acceptedQuantity()).isEqualTo(5);
        document.setStatus(StockDocumentStatus.DRAFT);
        assertThatThrownBy(() -> service.confirm(7L, new ConfirmStockDocumentRequest(1, "Không hợp lệ")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void overflowDoesNotSaveAnyBalanceOrMovement() {
        inventory.setQuantity(Integer.MAX_VALUE);
        stubLockedStock();
        assertThatThrownBy(() -> service.confirm(7L, new ConfirmStockDocumentRequest(null, null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("giới hạn");
        assertThat(inventory.getQuantity()).isEqualTo(Integer.MAX_VALUE);
        assertThat(document.getStatus()).isEqualTo(StockDocumentStatus.DRAFT);
        verify(inventories, never()).save(any());
        verifyNoInteractions(inventoryService);
    }

    @Test void confirmedDocumentCannotApplyStockTwice() {
        document.setStatus(StockDocumentStatus.CONFIRMED);
        when(documents.findByIdWithLock(7L)).thenReturn(Optional.of(document));
        assertThatThrownBy(() -> service.confirm(7L, new ConfirmStockDocumentRequest(null, null)))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(inventories, products, inventoryService);
    }

    @Test void unsupportedSortRejectedBeforeQuery() {
        assertThatThrownBy(() -> service.list(null, null, null, PageRequest.of(0, 10, Sort.by("product.name"))))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(documents);
    }

    private void stubLockedStock() {
        when(documents.findByIdWithLock(7L)).thenReturn(Optional.of(document));
        when(products.findByIdWithLock(10L)).thenReturn(Optional.of(product));
        when(inventories.findByProductIdWithLock(10L)).thenReturn(Optional.of(inventory));
    }
    private void stubConfirmation() {
        stubLockedStock();
        when(documents.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }
}
