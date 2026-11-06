package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateCraftVillageRequest;
import com.m4n.backend.dto.request.UpdateCraftVillageRequest;
import com.m4n.backend.dto.response.CraftVillageDetailResponse;
import com.m4n.backend.service.CraftVillageService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/craft-villages")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Craft Village Management", description = "Back-office craft village management APIs")
public class AdminCraftVillageController {

    private final CraftVillageService craftVillageService;

    @GetMapping
    @Operation(summary = "List all craft villages with artisan and product counts", description = "Returns all craft villages for back-office management.")
    public ResponseEntity<List<CraftVillageDetailResponse>> listAdminCraftVillages() {
        return ResponseEntity.ok(craftVillageService.listAdminCraftVillages());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get craft village detail by ID", description = "Returns full craft village detail.")
    public ResponseEntity<CraftVillageDetailResponse> getCraftVillageDetail(@PathVariable Long id) {
        return ResponseEntity.ok(craftVillageService.getAdminCraftVillageDetail(id));
    }

    @PostMapping
    @Operation(summary = "Create craft village", description = "Creates a new craft village.")
    public ResponseEntity<CraftVillageDetailResponse> createCraftVillage(@Valid @RequestBody CreateCraftVillageRequest request) {
        CraftVillageDetailResponse created = craftVillageService.createCraftVillage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update craft village", description = "Updates an existing craft village.")
    public ResponseEntity<CraftVillageDetailResponse> updateCraftVillage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCraftVillageRequest request
    ) {
        return ResponseEntity.ok(craftVillageService.updateCraftVillage(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete craft village", description = "Deletes a craft village if not in use by any artisans or products.")
    public ResponseEntity<Void> deleteCraftVillage(@PathVariable Long id) {
        craftVillageService.deleteCraftVillage(id);
        return ResponseEntity.noContent().build();
    }
}
