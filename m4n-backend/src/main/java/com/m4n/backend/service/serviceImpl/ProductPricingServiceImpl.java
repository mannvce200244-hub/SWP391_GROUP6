package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductPromotion;
import com.m4n.backend.repository.ProductPromotionRepository;
import com.m4n.backend.service.ProductPrice;
import com.m4n.backend.service.ProductPricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class ProductPricingServiceImpl implements ProductPricingService {
    private final ProductPromotionRepository promotionRepository;

    @Override @Transactional(readOnly = true)
    public Map<Long, ProductPrice> resolvePrices(List<Product> products) {
        if (products.isEmpty()) return Map.of();
        List<Long> ids = products.stream().map(Product::getId).distinct().toList();
        Map<Long, ProductPromotion> strongest = new HashMap<>();
        for (var promotion : promotionRepository.findApplicablePromotions(ids, Instant.now())) {
            strongest.putIfAbsent(promotion.getProduct().getId(), promotion);
        }
        Map<Long, ProductPrice> prices = new HashMap<>();
        for (Product product : products) {
            BigDecimal original = product.getPrice();
            ProductPromotion promotion = strongest.get(product.getId());
            boolean discounted = promotion != null && promotion.getDiscountRate().signum() > 0;
            BigDecimal charged = !discounted ? original : original.multiply(BigDecimal.ONE.subtract(promotion.getDiscountRate()))
                    .setScale(0, RoundingMode.HALF_UP).min(original);
            prices.put(product.getId(), new ProductPrice(original, charged, original.subtract(charged), discounted ? promotion.getId() : null));
        }
        return prices;
    }
}
