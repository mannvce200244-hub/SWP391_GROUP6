package com.m4n.backend.controller;

import com.m4n.backend.dto.response.ArtisanSummaryResponse;
import com.m4n.backend.service.ArtisanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;

@RestController
@RequestMapping("/api/v1/artisans")
@RequiredArgsConstructor
@Tag(name = "Artisan", description = "Public musical instrument artisan APIs")
public class ArtisanController {

    private final ArtisanService artisanService;

    @GetMapping
    @Operation(summary = "List all artisans", description = "Returns minimal list of artisans for catalog filters and product associations.")
    public ResponseEntity<List<ArtisanSummaryResponse>> listArtisans() {
        return ResponseEntity.ok(artisanService.listArtisans());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ArtisanSummaryResponse>> searchArtisans(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 6, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(artisanService.searchArtisans(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArtisanSummaryResponse> getArtisan(@PathVariable Long id) {
        return ResponseEntity.ok(artisanService.getArtisan(id));
    }
}
