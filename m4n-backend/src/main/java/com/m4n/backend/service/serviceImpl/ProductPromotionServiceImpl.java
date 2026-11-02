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

    @Override @Transactional(readOnly = true)
    public Page<ProductPromotionResponse> listPromotions(Long productId, Boolean isActive, int page, int size) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang phải từ 0 và nằm trong giới hạn hỗ trợ; số chương trình mỗi trang từ 1 đến 100.");
        }
        if (productId != null && productId <= 0) throw new IllegalArgumentException("ID sản phẩm không hợp lệ.");
        Specification<ProductPromotion> filters = (root, query, builder) -> builder.and(
                productId == null ? builder.conjunction() : builder.equal(root.get("product").get("id"), productId),
                isActive == null ? builder.conjunction() : builder.equal(root.get("isActive"), isActive));
        return promotionRepository.findAll(filters, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt", "id"))).map(this::toResponse);
    }

    @Override @Transactional
    public ProductPromotionResponse createPromotion(CreateProductPromotionRequest request) {
        ProductPromotion promotion = new ProductPromotion();
        updateFields(promotion, request.productId(), request.name(), request.discountRate(), request.isActive(), request.validFrom(), request.validUntil());
        return toResponse(promotionRepository.saveAndFlush(promotion));
    }

    @Override @Transactional
    public ProductPromotionResponse updatePromotion(Long id, UpdateProductPromotionRequest request) {
        ProductPromotion promotion = findPromotion(id);
        checkVersion(promotion, request.expectedVersion());
        updateFields(promotion, request.productId(), request.name(), request.discountRate(), request.isActive(), request.validFrom(), request.validUntil());
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

    private void updateFields(ProductPromotion promotion, Long productId, String name, BigDecimal rate, Boolean active, Instant from, Instant until) {
        if (from != null && until != null && !until.isAfter(from)) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu.");
        boolean sameProduct = promotion.getProduct() != null && productId.equals(promotion.getProduct().getId());
        promotion.setProduct((sameProduct ? productRepository.findById(productId) : productRepository.findByIdAndIsActiveTrue(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng lưu hành.")));
        promotion.setName(name.trim()); promotion.setDiscountRate(rate); promotion.setActive(active);
        promotion.setValidFrom(from); promotion.setValidUntil(until);
    }

    private ProductPromotionResponse toResponse(ProductPromotion promotion) {
        return new ProductPromotionResponse(promotion.getId(), promotion.getProduct().getId(), promotion.getProduct().getName(),
                promotion.getName(), promotion.getDiscountRate(), promotion.isActive(), promotion.getValidFrom(), promotion.getValidUntil(),
                promotion.getVersion(), promotion.getCreatedAt(), promotion.getUpdatedAt());
    }
}
