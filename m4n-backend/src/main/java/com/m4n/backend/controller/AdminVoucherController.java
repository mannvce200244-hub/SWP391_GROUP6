package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateVoucherRequest;
import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.dto.response.VoucherResponse;
import com.m4n.backend.service.VoucherService;
import com.m4n.backend.entity.PromotionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.RequestParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/admin/vouchers")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Tag(name = "Admin Vouchers", description = "Back-office promotion and voucher management (ADMIN, SUPER_ADMIN)")
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping("/search")
    public ResponseEntity<Page<VoucherResponse>> searchVouchers(@RequestParam(required = false) String search,
            @RequestParam(required = false) PromotionType promotionType, @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String state,
            @PageableDefault(size = 10, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(voucherService.searchVouchers(search, promotionType, isActive, state, pageable));
    }

    @PostMapping
    @Operation(summary = "Create voucher", description = "Creates a new promotional discount voucher.")
    public ResponseEntity<VoucherResponse> createVoucher(@Valid @RequestBody CreateVoucherRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(voucherService.createVoucher(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update voucher", description = "Updates an existing voucher's properties.")
    public ResponseEntity<VoucherResponse> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVoucherRequest request
    ) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete voucher", description = "Deletes a voucher by ID.")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }
}
