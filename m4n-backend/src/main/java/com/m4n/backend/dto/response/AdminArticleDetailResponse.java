package com.m4n.backend.dto.response;

import com.m4n.backend.entity.ArticleStatus;
import java.time.Instant;

public record AdminArticleDetailResponse(ArticleDetailResponse detail, ArticleStatus status,
        Long version, Instant updatedAt) {}
