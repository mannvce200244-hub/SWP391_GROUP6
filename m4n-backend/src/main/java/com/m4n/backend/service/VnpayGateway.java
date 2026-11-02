package com.m4n.backend.service;

import java.util.Map;
public interface VnpayGateway {
    String paymentUrl(Map<String, String> parameters);
    boolean verifyIpn(Map<String, String> parameters);
    Map<String, String> query(Map<String, String> parameters);
    Map<String, String> refund(Map<String, String> parameters);
}
