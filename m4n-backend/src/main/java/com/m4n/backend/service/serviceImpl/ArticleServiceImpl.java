package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.CreateArticleRequest;
import com.m4n.backend.dto.request.UpdateArticleRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.ArticleMapper;
import com.m4n.backend.repository.*;
import com.m4n.backend.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Objects;
import jakarta.persistence.criteria.Predicate;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {
    private final ArticleRepository articleRepository;
    private final ProductRepository productRepository;
    private final ArtisanRepository artisanRepository;
    private final CraftVillageRepository craftVillageRepository;
    private final ArticleMapper articleMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ArticleSummaryResponse> listPublishedArticles(ArticleType type, Long productId, Long artisanId, Long craftVillageId, int page, int size) {
        return articleRepository.findAll(filter(type, ArticleStatus.PUBLISHED, productId, artisanId, craftVillageId),
                pagination(page, size, "publishedAt")).map(article -> articleMapper.toSummary(article, true));
    }

    @Override
    @Transactional(readOnly = true)
    public ArticleDetailResponse getPublishedArticle(Long id) {
        requirePositiveId(id);
        Article article = articleRepository.findByIdAndStatus(id, ArticleStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết hoặc bài viết chưa được xuất bản."));
        return articleMapper.toDetail(article, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminArticleSummaryResponse> listAdminArticles(ArticleType type, ArticleStatus status, Long productId, Long artisanId, Long craftVillageId, int page, int size) {
        return articleRepository.findAll(filter(type, status, productId, artisanId, craftVillageId),
                pagination(page, size, "updatedAt")).map(articleMapper::toAdminSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminArticleDetailResponse getAdminArticle(Long id) {
        return articleMapper.toAdminDetail(findArticle(id));
    }

    @Override
    @Transactional
    public AdminArticleDetailResponse createArticle(CreateArticleRequest request) {
        Article article = Article.builder().status(ArticleStatus.DRAFT).build();
        setContent(article, request.title(), request.summary(), request.content(), request.type(), request.imageUrl(), request.videoUrl());
        setAssociations(article, request.productId(), request.artisanId(), request.craftVillageId());
        return articleMapper.toAdminDetail(articleRepository.saveAndFlush(article));
    }

    @Override
    @Transactional
    public AdminArticleDetailResponse updateArticle(Long id, UpdateArticleRequest request) {
        Article article = findArticle(id);
        checkVersion(article, request.expectedVersion());
        setContent(article, request.title(), request.summary(), request.content(), request.type(), request.imageUrl(), request.videoUrl());
        setAssociations(article, request.productId(), request.artisanId(), request.craftVillageId());
        if (request.status() == ArticleStatus.PUBLISHED && article.getStatus() != ArticleStatus.PUBLISHED) {
            article.setPublishedAt(Instant.now());
        } else if (request.status() == ArticleStatus.DRAFT) {
            article.setPublishedAt(null);
        }
        article.setStatus(request.status());
        return articleMapper.toAdminDetail(articleRepository.saveAndFlush(article));
    }

    @Override
    @Transactional
    public void deleteArticle(Long id, Long expectedVersion) {
        Article article = findArticle(id);
        checkVersion(article, expectedVersion);
        articleRepository.delete(article);
        articleRepository.flush();
    }

    private Article findArticle(Long id) {
        requirePositiveId(id);
        return articleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết."));
    }

    private void checkVersion(Article article, Long expectedVersion) {
        if (expectedVersion == null || expectedVersion < 0) throw new IllegalArgumentException("Thiếu phiên bản bài viết hợp lệ. Vui lòng tải lại.");
        if (!Objects.equals(article.getVersion(), expectedVersion)) {
            throw new IllegalStateException("Bài viết đã được quản trị viên khác thay đổi. Vui lòng tải lại trước khi lưu hoặc xóa.");
        }
    }

    private void setContent(Article article, String title, String summary, String content, ArticleType type, String imageUrl, String videoUrl) {
        article.setTitle(title.trim());
        article.setSummary(optionalText(summary));
        article.setContent(content.trim());
        article.setType(type);
        article.setImageUrl(optionalText(imageUrl));
        article.setVideoUrl(optionalText(videoUrl));
    }

    private void setAssociations(Article article, Long productId, Long artisanId, Long craftVillageId) {
        Product product = null;
        if (productId != null) {
            boolean existingLink = article.getProduct() != null && productId.equals(article.getProduct().getId());
            product = (existingLink ? productRepository.findById(productId) : productRepository.findByIdAndIsActiveTrue(productId))
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm liên kết không tồn tại hoặc đã ngừng lưu hành."));
        }
        article.setProduct(product);
        article.setArtisan(artisanId == null ? null : artisanRepository.findById(artisanId)
                .orElseThrow(() -> new ResourceNotFoundException("Nghệ nhân liên kết không tồn tại.")));
        article.setCraftVillage(craftVillageId == null ? null : craftVillageRepository.findById(craftVillageId)
                .orElseThrow(() -> new ResourceNotFoundException("Làng nghề liên kết không tồn tại.")));
    }

    private Specification<Article> filter(ArticleType type, ArticleStatus status, Long productId, Long artisanId, Long villageId) {
        if (productId != null) requirePositiveId(productId);
        if (artisanId != null) requirePositiveId(artisanId);
        if (villageId != null) requirePositiveId(villageId);
        return (root, query, builder) -> {
            var predicates = new ArrayList<Predicate>();
            if (type != null) predicates.add(builder.equal(root.get("type"), type));
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            if (productId != null) predicates.add(builder.equal(root.get("product").get("id"), productId));
            if (artisanId != null) predicates.add(builder.equal(root.get("artisan").get("id"), artisanId));
            if (villageId != null) predicates.add(builder.equal(root.get("craftVillage").get("id"), villageId));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Pageable pagination(int page, int size, String orderField) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang phải từ 0 và nằm trong giới hạn hỗ trợ; số bài viết mỗi trang phải từ 1 đến 100.");
        }
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, orderField, "id"));
    }

    private void requirePositiveId(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID phải là số nguyên dương.");
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
