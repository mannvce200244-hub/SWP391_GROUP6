package com.m4n.backend.service;

import java.math.BigDecimal;

public interface PosInvoiceNotifier {
    boolean isAvailable();
    void sendInvoice(String email, String invoiceCode, BigDecimal amount, byte[] pdf);
}
