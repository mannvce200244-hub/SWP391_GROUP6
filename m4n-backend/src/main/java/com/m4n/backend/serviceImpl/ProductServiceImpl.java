package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(Long productId) {
        if (productId == null) {
            throw new ProductNotFoundException("ID sản phẩm không hợp lệ");
        }

        Product product = productRepository.findWithDetailsByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        Inventory inventory = inventoryRepository.findByProductId(product.getId()).orElse(null);
        int stockQuantity = inventory != null ? inventory.getQuantity() : 0;
        String availability = stockQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
        return productMapper.toDetailResponse(product, availability, stockQuantity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummaryResponse> listProducts(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        List<Product> products = productRepository.findAllByIsActiveTrueOrderByCreatedAtDesc();

        // Retrieve inventory quantities in batch to avoid N+1 queries
        Map<Long, Integer> inventoryMap = inventoryRepository.findAll().stream()
                .filter(inv -> inv.getProduct() != null)
                .collect(Collectors.toMap(
                        inv -> inv.getProduct().getId(),
                        Inventory::getQuantity,
                        (existing, replacement) -> existing
                ));

        return products.stream()
                .filter(product -> matchesFilters(product, keyword, group, artisan, craftVillage, minPrice, maxPrice))
                .map(product -> {
                    int quantity = inventoryMap.getOrDefault(product.getId(), 0);
                    String availability = quantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
                    return productMapper.toSummaryResponse(product, availability);
                })
                .toList();
    }

    private boolean matchesFilters(
            Product product,
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        if (keyword != null && !keyword.isBlank()) {
            String term = keyword.trim().toLowerCase();
            boolean matchName = product.getName() != null && product.getName().toLowerCase().contains(term);
            boolean matchCode = product.getCode() != null && product.getCode().toLowerCase().contains(term);
            if (!matchName && !matchCode) return false;
        }

        if (group != null && !group.isBlank()) {
            String g = group.trim().toLowerCase();
            if (product.getCategory() == null) return false;
            boolean matchCatName = product.getCategory().getName() != null &&
                    product.getCategory().getName().toLowerCase().contains(g);
            boolean matchCatCode = product.getCategory().getCode() != null &&
                    product.getCategory().getCode().toLowerCase().contains(g);
            if (!matchCatName && !matchCatCode) return false;
        }

        if (artisan != null && !artisan.isBlank()) {
            String a = artisan.trim().toLowerCase();
            if (product.getArtisan() == null || product.getArtisan().getName() == null ||
                    !product.getArtisan().getName().toLowerCase().contains(a)) {
                return false;
            }
        }

        if (craftVillage != null && !craftVillage.isBlank()) {
            String v = craftVillage.trim().toLowerCase();
            if (product.getCraftVillage() == null || product.getCraftVillage().getName() == null ||
                    !product.getCraftVillage().getName().toLowerCase().contains(v)) {
                return false;
            }
        }

        if (minPrice != null && product.getPrice() != null && product.getPrice().compareTo(minPrice) < 0) {
            return false;
        }

        if (maxPrice != null && product.getPrice() != null && product.getPrice().compareTo(maxPrice) > 0) {
            return false;
        }

        return true;
    }
}
