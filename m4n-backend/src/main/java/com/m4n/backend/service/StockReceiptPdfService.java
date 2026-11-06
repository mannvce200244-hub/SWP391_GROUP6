package com.m4n.backend.service;

public interface StockReceiptPdfService {
    byte[] generateReceiptPdf(Long documentId);
}
