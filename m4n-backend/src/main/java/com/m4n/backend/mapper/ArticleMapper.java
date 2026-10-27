package com.m4n.backend.mapper;

import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.Article;
import org.springframework.stereotype.Component;

@Component
public class ArticleMapper {
    public ArticleSummaryResponse toSummary(Article article, boolean publicView) {
        var product = article.getProduct();
        var artisan = article.getArtisan();
        var village = article.getCraftVillage();
        boolean showProduct = product != null && (!publicView || product.isActive());
        return new ArticleSummaryResponse(article.getId(), article.getTitle(), article.getSummary(),
                article.getType(), article.getImageUrl(), article.getPublishedAt(),
                showProduct ? product.getId() : null, showProduct ? product.getName() : null,
                artisan != null ? artisan.getId() : null, artisan != null ? artisan.getName() : null,
                village != null ? village.getId() : null, village != null ? village.getName() : null);
    }

    public ArticleDetailResponse toDetail(Article article, boolean publicView) {
        return new ArticleDetailResponse(toSummary(article, publicView), article.getContent(), article.getVideoUrl());
    }

    public AdminArticleSummaryResponse toAdminSummary(Article article) {
        return new AdminArticleSummaryResponse(toSummary(article, false), article.getStatus(), article.getVersion(), article.getUpdatedAt());
    }

    public AdminArticleDetailResponse toAdminDetail(Article article) {
        return new AdminArticleDetailResponse(toDetail(article, false), article.getStatus(), article.getVersion(), article.getUpdatedAt());
    }
}
