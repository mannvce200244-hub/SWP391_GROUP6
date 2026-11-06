package com.m4n.backend.controller;

import com.m4n.backend.dto.response.VoucherResponse;
import com.m4n.backend.entity.PromotionType;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class VoucherSuggestionsController {
    private final VoucherService voucherService;

    @GetMapping("/checkout/voucher-suggestions")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Page<VoucherResponse> checkout(@RequestParam(defaultValue = "MANUAL") PromotionType type,
            @PageableDefault(size = 6) Pageable pageable) {
        return voucherService.getSuggestions(type, pageable);
    }

    @GetMapping("/pos/voucher-suggestions")
    @PreAuthorize("hasRole('POS_STAFF')")
    public Page<VoucherResponse> pos(@PageableDefault(size = 6) Pageable pageable) {
        return voucherService.getSuggestions(PromotionType.MANUAL, pageable);
    }
}
