package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateArticleRequest;
import com.m4n.backend.dto.request.UpdateArticleRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.ArticleStatus;
import com.m4n.backend.entity.ArticleType;
import com.m4n.backend.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/articles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminArticleController {
    private final ArticleService articleService;

    @GetMapping
    public Page<AdminArticleSummaryResponse> listArticles(@RequestParam(required = false) ArticleType type,
            @RequestParam(required = false) ArticleStatus status, @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long artisanId, @RequestParam(required = false) Long craftVillageId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return articleService.listAdminArticles(type, status, productId, artisanId, craftVillageId, page, size);
    }

    @GetMapping("/{id}")
    public AdminArticleDetailResponse getArticle(@PathVariable Long id) {
        return articleService.getAdminArticle(id);
    }

    @PostMapping
    public ResponseEntity<AdminArticleDetailResponse> createArticle(@Valid @RequestBody CreateArticleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(articleService.createArticle(request));
    }

    @PutMapping("/{id}")
    public AdminArticleDetailResponse updateArticle(@PathVariable Long id, @Valid @RequestBody UpdateArticleRequest request) {
        return articleService.updateArticle(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id, @RequestParam Long expectedVersion) {
        articleService.deleteArticle(id, expectedVersion);
        return ResponseEntity.noContent().build();
    }
}
