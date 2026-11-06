package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.repository.PosMomoPaymentRepository;
import com.m4n.backend.service.InvoicePdfService;
import com.m4n.backend.service.PosInvoiceEmailService;
import com.m4n.backend.service.PosInvoiceNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Service
public class PosInvoiceEmailServiceImpl implements PosInvoiceEmailService {
    private final PosMomoPaymentRepository payments;
    private final InvoicePdfService pdfs;
    private final PosInvoiceNotifier notifier;
    private final TransactionTemplate transaction;

    public PosInvoiceEmailServiceImpl(PosMomoPaymentRepository payments, InvoicePdfService pdfs,
            PosInvoiceNotifier notifier, PlatformTransactionManager manager) {
        this.payments = payments;
        this.pdfs = pdfs;
        this.notifier = notifier;
        this.transaction = new TransactionTemplate(manager);
    }

    @Override
    @Scheduled(fixedDelay = 10000, initialDelay = 10000)
    public void deliverPending() {
        if (!notifier.isAvailable()) return;
        var retryBefore = Instant.now().minusSeconds(300);
        var ids = payments.findPendingReceiptEmails(retryBefore, PageRequest.of(0, 20));
        for (String id : ids) {
            try {
                var receipt = transaction.execute(tx -> {
                    var payment = payments.findByIdWithLock(id).orElseThrow();
                    if (payment.getReceiptEmailQueuedAt() == null || payment.getReceiptEmailSentAt() != null
                            || payment.getInvoice() == null || (payment.getReceiptEmailAttemptedAt() != null
                            && !payment.getReceiptEmailAttemptedAt().isBefore(retryBefore))) return null;
                    Instant attempt = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
                    payment.setReceiptEmailAttemptedAt(attempt);
                    var invoice = payment.getInvoice();
                    return new Receipt(invoice.getId(), invoice.getInvoiceCode(), invoice.getFinalAmount(),
                            payment.getCustomerEmail(), attempt);
                });
                if (receipt == null) continue;
                // The invoice and delivery lease are committed before PDF/SMTP I/O.
                notifier.sendInvoice(receipt.email(), receipt.code(), receipt.amount(), pdfs.generateInvoicePdf(receipt.invoiceId()));
                transaction.executeWithoutResult(tx -> {
                    var payment = payments.findByIdWithLock(id).orElseThrow();
                    if (receipt.attempt().equals(payment.getReceiptEmailAttemptedAt())) {
                        payment.setReceiptEmailSentAt(Instant.now());
                    }
                });
            } catch (RuntimeException ex) {
                // Retry after the lease expires. Never log recipient/provider details or undo the sale.
                log.warn("POS receipt email delivery remains pending for payment {}", id);
            }
        }
    }

    private record Receipt(Long invoiceId, String code, BigDecimal amount, String email, Instant attempt) {}
}
