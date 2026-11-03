package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosVnpayPaymentRequest;
import com.m4n.backend.dto.response.PosMomoPaymentResponse;
import com.m4n.backend.dto.response.VnpayIpnResponse;
import org.springframework.data.domain.Page;
import java.util.Map;

public interface PosVnpayPaymentService {
    PosMomoPaymentResponse create(PosVnpayPaymentRequest request, String email, String ipAddress, String origin);
    PosMomoPaymentResponse status(String id, String email);
    Page<PosMomoPaymentResponse> recent(String email, int page);
    PosMomoPaymentResponse reconcile(String id, String email);
    PosMomoPaymentResponse cancel(String id, String email);
    VnpayIpnResponse processIpn(Map<String, String> params);
}

