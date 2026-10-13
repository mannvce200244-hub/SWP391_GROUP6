package com.m4n.backend.service;

public interface InvoicePdfService {
    byte[] generateInvoicePdf(Long invoiceId);
}
