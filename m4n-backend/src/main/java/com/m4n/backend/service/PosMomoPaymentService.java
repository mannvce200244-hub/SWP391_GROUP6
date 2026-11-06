package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosMomoPaymentRequest;
import com.m4n.backend.dto.response.PosMomoPaymentResponse;
import org.springframework.data.domain.Page;
import java.util.Map;

public interface PosMomoPaymentService {
    PosMomoPaymentResponse create(PosMomoPaymentRequest request, String email, String origin);
    PosMomoPaymentResponse status(String id, String email);
    PosMomoPaymentResponse reconcile(String id, String email);
    PosMomoPaymentResponse cancel(String id, String email);
    Page<PosMomoPaymentResponse> recent(String email, int page);
    void processIpn(Map<String, String> result);
}
