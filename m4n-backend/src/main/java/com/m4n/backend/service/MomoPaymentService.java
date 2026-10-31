package com.m4n.backend.service;
import com.m4n.backend.dto.response.*;
import java.math.BigDecimal;
import java.util.Map;

public interface MomoPaymentService {
    boolean isAvailable();
    void validateAmount(BigDecimal amount);
    PaymentUrlResponse create(Long id, String email, String origin);
    PaymentStatusResponse status(Long id, String email);
    PaymentStatusResponse reconcile(Long id, String email);
    void processIpn(Map<String, String> result);
    PaymentStatusResponse refund(Long id, String reason, String email);
    PaymentStatusResponse refundCustomerCancellation(Long id, String reason, String email);
    PaymentStatusResponse reconcileRefund(Long id, String email);
}
