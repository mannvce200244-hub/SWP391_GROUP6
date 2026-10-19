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
}
