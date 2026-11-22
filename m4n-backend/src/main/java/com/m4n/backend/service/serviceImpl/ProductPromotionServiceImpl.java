package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.ProductPromotionResponse;
import com.m4n.backend.entity.ProductPromotion;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.ProductPromotionRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.ProductPromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Service @RequiredArgsConstructor
public class ProductPromotionServiceImpl implements ProductPromotionService {
    private final ProductPromotionRepository promotionRepository;
    private final ProductRepository productRepository;
    private final com.m4n.backend.repository.ProductFamilyRepository familyRepository;

    @Override @Transactional(readOnly = true)
    public Page<ProductPromotionResponse> listPromotions(Long productId, Boolean isActive, int page, int size) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang phải từ 0 và nằm trong giới hạn hỗ trợ; số chương trình mỗi trang từ 1 đến 100.");
        }
        if (productId != null && productId <= 0) throw new IllegalArgumentException("ID sản phẩm không hợp lệ.");
        Long familyId = productId == null ? null : productRepository.findById(productId)
                .map(product -> product.getFamily() == null ? null : product.getFamily().getId()).orElse(null);
        Specification<ProductPromotion> filters = (root, query, builder) -> {
            var target = productId == null ? builder.conjunction() : builder.equal(root.get("product").get("id"), productId);
            if (familyId != null) {
                query.distinct(true);
                target = builder.or(target, builder.equal(root.join("families", jakarta.persistence.criteria.JoinType.LEFT).get("id"), familyId));
            }
            return builder.and(target, isActive == null ? builder.conjunction() : builder.equal(root.get("isActive"), isActive));
        };
        return promotionRepository.findAll(filters, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt", "id"))).map(this::toResponse);
    }

    @Override @Transactional
    public ProductPromotionResponse createPromotion(CreateProductPromotionRequest request) {
        ProductPromotion promotion = new ProductPromotion();
        updateFields(promotion, request.productId(), request.familyIds(), request.name(), request.discountRate(), request.isActive(), request.validFrom(), request.validUntil());
        return toResponse(promotionRepository.saveAndFlush(promotion));
    }

    @Override @Transactional
    public ProductPromotionResponse updatePromotion(Long id, UpdateProductPromotionRequest request) {
        ProductPromotion promotion = findPromotion(id);
        checkVersion(promotion, request.expectedVersion());
        updateFields(promotion, request.productId(), request.familyIds(), request.name(), request.discountRate(), request.isActive(), request.validFrom(), request.validUntil());
        return toResponse(promotionRepository.saveAndFlush(promotion));
    }

    @Override @Transactional
    public void deletePromotion(Long id, Long expectedVersion) {
        ProductPromotion promotion = findPromotion(id);
        checkVersion(promotion, expectedVersion);
        promotionRepository.delete(promotion);
        promotionRepository.flush();
    }

    private ProductPromotion findPromotion(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID chương trình không hợp lệ.");
        return promotionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình giảm giá sản phẩm."));
    }

    private void checkVersion(ProductPromotion promotion, Long expectedVersion) {
        if (expectedVersion == null || expectedVersion < 0) throw new IllegalArgumentException("Thiếu phiên bản chương trình hợp lệ.");
        if (!Objects.equals(promotion.getVersion(), expectedVersion)) throw new IllegalStateException("Chương trình đã được quản trị viên khác thay đổi. Vui lòng tải lại.");
    }

    private void updateFields(ProductPromotion promotion, Long productId, java.util.List<Long> familyIds, String name, BigDecimal rate, Boolean active, Instant from, Instant until) {
        Instant baseline = promotion.getCreatedAt() == null ? Instant.now() : promotion.getCreatedAt();
        if (from != null && from.isAfter(baseline)) baseline = from;
        if (until != null && until.isBefore(baseline.plusSeconds(3600))) {
            throw new IllegalArgumentException("Thời gian kết thúc phải cách lúc tạo và lúc bắt đầu ít nhất 1 giờ.");
        }
        boolean multiple = familyIds != null && !familyIds.isEmpty();
        if ((productId == null) == !multiple) throw new IllegalArgumentException("Chọn ít nhất một sản phẩm; không trộn lựa chọn sản phẩm và SKU cũ.");
        if (multiple) {
            if (familyIds.stream().anyMatch(id -> id == null || id <= 0) || new java.util.HashSet<>(familyIds).size() != familyIds.size()) {
                throw new IllegalArgumentException("Danh sách sản phẩm chứa mã không hợp lệ hoặc trùng lặp.");
            }
            var existingIds = promotion.getFamilies().stream().map(com.m4n.backend.entity.ProductFamily::getId).collect(java.util.stream.Collectors.toSet());
            if (promotion.getProduct() != null && promotion.getProduct().getFamily() != null) existingIds.add(promotion.getProduct().getFamily().getId());
            var families = familyRepository.findAllById(familyIds);
            if (families.size() != familyIds.size()) throw new ResourceNotFoundException("Một sản phẩm được chọn không còn tồn tại.");
            for (var family : families) {
                if (!existingIds.contains(family.getId()) && !productRepository.existsByFamilyIdAndIsActiveTrue(family.getId())) {
                    throw new IllegalArgumentException("Sản phẩm “" + family.getName() + "” đã ngừng kinh doanh.");
                }
            }
            promotion.setFamilies(new java.util.LinkedHashSet<>(families));
            promotion.setProduct(null);
        } else {
            boolean sameProduct = promotion.getProduct() != null && productId.equals(promotion.getProduct().getId());
            promotion.setProduct((sameProduct ? productRepository.findById(productId) : productRepository.findByIdAndIsActiveTrue(productId))
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng lưu hành.")));
            promotion.getFamilies().clear();
        }
        promotion.setName(name.trim()); promotion.setDiscountRate(rate); promotion.setActive(active);
        promotion.setValidFrom(from); promotion.setValidUntil(until);
    }

    private ProductPromotionResponse toResponse(ProductPromotion promotion) {
        var targets = promotion.getFamilies().stream().sorted(java.util.Comparator.comparing(com.m4n.backend.entity.ProductFamily::getId))
                .map(family -> new com.m4n.backend.dto.response.ProductPromotionTargetResponse(family.getId(), family.getName())).toList();
        if (targets.isEmpty() && promotion.getProduct() != null && promotion.getProduct().getFamily() != null) {
            targets = java.util.List.of(new com.m4n.backend.dto.response.ProductPromotionTargetResponse(promotion.getProduct().getFamily().getId(), promotion.getProduct().getFamilyName()));
        }
        return new ProductPromotionResponse(promotion.getId(), promotion.getProduct() == null ? null : promotion.getProduct().getId(), promotion.getProduct() == null ? null : promotion.getProduct().getName(),
                promotion.getName(), promotion.getDiscountRate(), promotion.isActive(), promotion.getValidFrom(), promotion.getValidUntil(),
                promotion.getVersion(), promotion.getCreatedAt(), promotion.getUpdatedAt(), targets);
    }
}
