package com.m4n.backend.controller;

import com.m4n.backend.dto.request.PosMomoPaymentRequest;
import com.m4n.backend.dto.response.PosMomoPaymentResponse;
import com.m4n.backend.service.PosMomoPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/v1/pos/payments/momo")
@PreAuthorize("hasRole('POS_STAFF')")
@RequiredArgsConstructor
public class PosMomoPaymentController {
    private final PosMomoPaymentService service;
    @PostMapping
    public PosMomoPaymentResponse create(@Valid @RequestBody PosMomoPaymentRequest request,
            Authentication actor, @RequestHeader(value = "Origin", required = false) String origin) {
        return service.create(request, actor.getName(), origin);
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
