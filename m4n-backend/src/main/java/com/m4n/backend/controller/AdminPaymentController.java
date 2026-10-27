package com.m4n.backend.controller;

import com.m4n.backend.dto.request.RefundPaymentRequest;
import com.m4n.backend.dto.response.PaymentStatusResponse;
import com.m4n.backend.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/orders/{id}/refund")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminPaymentController {
    private final PaymentService service;
    public AdminPaymentController(PaymentService service) { this.service = service; }
    @PostMapping
    public PaymentStatusResponse refund(@PathVariable Long id, @Valid @RequestBody RefundPaymentRequest input,
            Authentication auth, HttpServletRequest request) {
        return service.refund(id, input.reason(), auth.getName(), request.getRemoteAddr());
    }
    @PostMapping("/reconcile")
    public PaymentStatusResponse reconcile(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return service.reconcileRefund(id, auth.getName(), request.getRemoteAddr());
    }
}
