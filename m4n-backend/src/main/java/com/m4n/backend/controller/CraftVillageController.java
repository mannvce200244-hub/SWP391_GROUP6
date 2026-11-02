package com.m4n.backend.controller;

import com.m4n.backend.dto.response.CraftVillageSummaryResponse;
import com.m4n.backend.service.CraftVillageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;

@RestController
@RequestMapping("/api/v1/craft-villages")
@Tag(name = "Craft Village", description = "Public craft village APIs")
public class CraftVillageController {

    private final CraftVillageService craftVillageService;

    public CraftVillageController(CraftVillageService craftVillageService) {
        this.craftVillageService = craftVillageService;
    }

    @GetMapping
    @Operation(summary = "List all craft villages", description = "Returns summary of registered traditional craft villages.")
    public ResponseEntity<List<CraftVillageSummaryResponse>> listCraftVillages() {
        return ResponseEntity.ok(craftVillageService.listCraftVillages());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<CraftVillageSummaryResponse>> searchCraftVillages(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @PageableDefault(size = 6, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(craftVillageService.searchCraftVillages(keyword, location, pageable));
    }

    @GetMapping("/locations")
    public ResponseEntity<List<String>> listLocations() {
        return ResponseEntity.ok(craftVillageService.listLocations());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get craft village by ID", description = "Returns craft village details by ID.")
    public ResponseEntity<CraftVillageSummaryResponse> getCraftVillage(@PathVariable Long id) {
        return ResponseEntity.ok(craftVillageService.getCraftVillage(id));
    }
}
