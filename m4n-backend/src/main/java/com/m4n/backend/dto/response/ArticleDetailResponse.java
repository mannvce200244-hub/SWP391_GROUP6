package com.m4n.backend.dto.response;

public record ArticleDetailResponse(ArticleSummaryResponse article, String content, String videoUrl) {}
