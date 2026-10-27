package com.m4n.backend.controller;

import com.m4n.backend.dto.response.ArticleDetailResponse;
import com.m4n.backend.dto.response.ArticleSummaryResponse;
import com.m4n.backend.entity.ArticleType;
import com.m4n.backend.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticleController {
    private final ArticleService articleService;

    @GetMapping
    public Page<ArticleSummaryResponse> listArticles(@RequestParam(required = false) ArticleType type,
            @RequestParam(required = false) Long productId, @RequestParam(required = false) Long artisanId,
            @RequestParam(required = false) Long craftVillageId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return articleService.listPublishedArticles(type, productId, artisanId, craftVillageId, page, size);
    }

    @GetMapping("/{id}")
    public ArticleDetailResponse getArticle(@PathVariable Long id) {
        return articleService.getPublishedArticle(id);
    }
}
