package com.m4n.backend.controller;

import com.m4n.backend.dto.request.ApplyVoucherRequest;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vouchers")
@Tag(name = "Voucher", description = "Voucher calculation and validation APIs")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @PostMapping("/validate")
    @Operation(summary = "Validate voucher code against order amount", description = "Checks minimum order value and computes discount rate authoritative on backend.")
    public ResponseEntity<VoucherValidationResponse> validateVoucher(@Valid @RequestBody ApplyVoucherRequest request) {
        return ResponseEntity.ok(voucherService.validateAndCalculate(request));
    }
}
