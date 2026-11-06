package com.m4n.backend.service;
import java.math.BigDecimal;
import java.util.Map;

public interface MomoGateway {
    String create(String reference, BigDecimal amount, Long orderId, String customerEmail, String redirectUrl);
    String createPos(String reference, BigDecimal amount, String customerEmail, String redirectUrl);
    Map<String, String> query(String reference, BigDecimal amount);
    Map<String, String> refund(String reference, String originalTransaction, BigDecimal amount, String reason);
    boolean verifyIpn(Map<String, String> result);
}
