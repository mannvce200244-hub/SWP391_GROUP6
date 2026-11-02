package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateArticleRequest;
import com.m4n.backend.dto.request.UpdateArticleRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.ArticleStatus;
import com.m4n.backend.entity.ArticleType;
import org.springframework.data.domain.Page;

public interface ArticleService {
    Page<ArticleSummaryResponse> listPublishedArticles(ArticleType type, Long productId, Long artisanId, Long craftVillageId, int page, int size);
    ArticleDetailResponse getPublishedArticle(Long id);
    Page<AdminArticleSummaryResponse> listAdminArticles(ArticleType type, ArticleStatus status, Long productId, Long artisanId, Long craftVillageId, int page, int size);
    AdminArticleDetailResponse getAdminArticle(Long id);
    AdminArticleDetailResponse createArticle(CreateArticleRequest request);
    AdminArticleDetailResponse updateArticle(Long id, UpdateArticleRequest request);
    void deleteArticle(Long id, Long expectedVersion);
}
