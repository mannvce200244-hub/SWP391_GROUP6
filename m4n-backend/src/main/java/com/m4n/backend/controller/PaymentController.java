package com.m4n.backend.controller;

import com.m4n.backend.dto.response.*;
import com.m4n.backend.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService service;
    public PaymentController(PaymentService service) { this.service = service; }
    @GetMapping("/options")
    public PaymentOptionsResponse options() { return service.getOptions(); }
    @PostMapping("/orders/{id}/vnpay")
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentUrlResponse create(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return service.createPayment(id, auth.getName(), request.getRemoteAddr());
    }
    @GetMapping("/orders/{id}")
    public PaymentStatusResponse status(@PathVariable Long id, Authentication auth) { return service.getStatus(id, auth.getName()); }
    @PostMapping("/orders/{id}/reconcile")
    public PaymentStatusResponse reconcile(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return service.reconcilePayment(id, auth.getName(), request.getRemoteAddr());
    }
    @GetMapping("/vnpay/ipn")
    public VnpayIpnResponse ipn(@RequestParam MultiValueMap<String, String> parameters) { return service.processIpn(parameters); }
}
