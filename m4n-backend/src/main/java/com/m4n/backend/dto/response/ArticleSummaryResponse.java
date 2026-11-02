package com.m4n.backend.dto.response;

import com.m4n.backend.entity.ArticleType;
import java.time.Instant;

public record ArticleSummaryResponse(Long id, String title, String summary, ArticleType type,
        String imageUrl, Instant publishedAt, Long productId, String productName,
        Long artisanId, String artisanName, Long craftVillageId, String craftVillageName) {}
