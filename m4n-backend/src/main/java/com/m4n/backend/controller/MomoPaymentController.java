package com.m4n.backend.controller;
import com.m4n.backend.dto.response.PaymentUrlResponse;
import com.m4n.backend.dto.request.MomoIpnRequest;
import jakarta.validation.Valid;
import com.m4n.backend.service.MomoPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class MomoPaymentController {
    private final MomoPaymentService service;
    @PostMapping("/orders/{id}/momo")
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentUrlResponse create(@PathVariable Long id, Authentication authentication,
            @RequestHeader(value = "Origin", required = false) String origin) {
        return service.create(id, authentication.getName(), origin);
    }
    @PostMapping("/momo/ipn")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void ipn(@Valid @RequestBody MomoIpnRequest result) { service.processIpn(result.signedFields()); }
}
