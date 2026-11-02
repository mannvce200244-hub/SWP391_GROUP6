package com.m4n.backend.controller;

import com.m4n.backend.dto.request.PosVnpayPaymentRequest;
import com.m4n.backend.dto.response.PosMomoPaymentResponse;
import com.m4n.backend.service.PosVnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pos/payments/vnpay")
@PreAuthorize("hasRole('POS_STAFF')")
@RequiredArgsConstructor
public class PosVnpayPaymentController {
    private final PosVnpayPaymentService service;

    @PostMapping
    public PosMomoPaymentResponse create(@Valid @RequestBody PosVnpayPaymentRequest request,
            Authentication actor,
            HttpServletRequest httpRequest,
            @RequestHeader(value = "Origin", required = false) String origin) {
        return service.create(request, actor.getName(), httpRequest.getRemoteAddr(), origin);
    }

    @GetMapping
    public Page<PosMomoPaymentResponse> recent(Authentication actor, @RequestParam(defaultValue = "0") int page) {
        return service.recent(actor.getName(), page);
    }

    @GetMapping("/{id}")
    public PosMomoPaymentResponse status(@PathVariable String id, Authentication actor) {
        return service.status(id, actor.getName());
    }

    @PostMapping("/{id}/reconcile")
    public PosMomoPaymentResponse reconcile(@PathVariable String id, Authentication actor) {
        return service.reconcile(id, actor.getName());
    }

    @PostMapping("/{id}/cancel")
    public PosMomoPaymentResponse cancel(@PathVariable String id, Authentication actor) {
        return service.cancel(id, actor.getName());
    }
}

