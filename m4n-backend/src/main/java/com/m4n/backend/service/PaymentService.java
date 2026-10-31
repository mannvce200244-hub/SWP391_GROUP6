package com.m4n.backend.service;

import com.m4n.backend.dto.response.PaymentOptionsResponse;
import com.m4n.backend.dto.response.PaymentStatusResponse;
import com.m4n.backend.dto.response.PaymentUrlResponse;
import com.m4n.backend.dto.response.VnpayIpnResponse;
import org.springframework.util.MultiValueMap;

public interface PaymentService {
    boolean isAvailable();
    boolean isMomoAvailable();
    void validateMomoAmount(java.math.BigDecimal amount);
    boolean hasVerifiedFullRefund(Long orderId);
    boolean isRefundPending(Long orderId);
    boolean isPaymentPending(Long orderId);
    void validatePaymentAmount(java.math.BigDecimal amount);
    PaymentOptionsResponse getOptions();
    PaymentUrlResponse createPayment(Long orderId, String currentEmail, String ipAddress);
    PaymentStatusResponse getStatus(Long orderId, String currentEmail);
    PaymentStatusResponse reconcilePayment(Long orderId, String currentEmail, String ipAddress);
    VnpayIpnResponse processIpn(MultiValueMap<String, String> parameters);
    PaymentStatusResponse refund(Long orderId, String reason, String currentEmail, String ipAddress);
    PaymentStatusResponse refundCustomerCancellation(Long orderId, String reason, String currentEmail);
    PaymentStatusResponse reconcileRefund(Long orderId, String currentEmail, String ipAddress);
}
