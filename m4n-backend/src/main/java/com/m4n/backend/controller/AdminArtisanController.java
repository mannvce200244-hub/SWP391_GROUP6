package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateArtisanRequest;
import com.m4n.backend.dto.request.UpdateArtisanRequest;
import com.m4n.backend.dto.response.ArtisanDetailResponse;
import com.m4n.backend.service.ArtisanService;
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
@RequestMapping("/api/v1/admin/artisans")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Artisan Management", description = "Back-office artisan management APIs")
public class AdminArtisanController {

    private final ArtisanService artisanService;

    @GetMapping
    @Operation(summary = "List all artisans with craft village and product counts", description = "Returns all artisans for back-office management.")
    public ResponseEntity<List<ArtisanDetailResponse>> listAdminArtisans() {
        return ResponseEntity.ok(artisanService.listAdminArtisans());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get artisan detail by ID", description = "Returns full artisan detail.")
    public ResponseEntity<ArtisanDetailResponse> getArtisanDetail(@PathVariable Long id) {
        return ResponseEntity.ok(artisanService.getAdminArtisanDetail(id));
    }

    @PostMapping
    @Operation(summary = "Create artisan", description = "Creates a new artisan.")
    public ResponseEntity<ArtisanDetailResponse> createArtisan(@Valid @RequestBody CreateArtisanRequest request) {
        ArtisanDetailResponse created = artisanService.createArtisan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update artisan", description = "Updates an existing artisan.")
    public ResponseEntity<ArtisanDetailResponse> updateArtisan(
            @PathVariable Long id,
            @Valid @RequestBody UpdateArtisanRequest request
    ) {
        return ResponseEntity.ok(artisanService.updateArtisan(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete artisan", description = "Deletes an artisan if not in use by any products.")
    public ResponseEntity<Void> deleteArtisan(@PathVariable Long id) {
        artisanService.deleteArtisan(id);
        return ResponseEntity.noContent().build();
    }
}
