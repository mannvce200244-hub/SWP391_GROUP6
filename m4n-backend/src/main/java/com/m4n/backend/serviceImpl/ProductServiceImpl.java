package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.exception.InvalidFilterException;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductMediaRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.ProductService;
import com.m4n.backend.specification.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductMediaRepository productMediaRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            ProductMediaRepository productMediaRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.productMediaRepository = productMediaRepository;
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
        int stockQuantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        String availability = stockQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
        return productMapper.toDetailResponse(product, availability, stockQuantity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> listProducts(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    ) {
        validatePriceFilters(minPrice, maxPrice);

        Specification<Product> spec = ProductSpecification.filterCatalog(
                keyword, group, artisan, craftVillage, minPrice, maxPrice
        );

        Page<Product> productPage = productRepository.findAll(spec, pageable != null ? pageable : Pageable.unpaged());

        List<Long> productIds = productPage.getContent().stream()
                .map(Product::getId)
                .toList();

        Map<Long, Integer> inventoryMap = productIds.isEmpty()
                ? Collections.emptyMap()
                : inventoryRepository.findByProductIdIn(productIds).stream()
                .filter(inv -> inv.getProduct() != null)
                .collect(Collectors.toMap(
                        inv -> inv.getProduct().getId(),
                        inv -> inv.getQuantity() != null ? inv.getQuantity() : 0,
                        (existing, replacement) -> existing
                ));

        Map<Long, ProductMedia> primaryMediaMap = productIds.isEmpty()
                ? Collections.emptyMap()
                : productMediaRepository.findByProductIdInOrderBySortOrderAsc(productIds).stream()
                .filter(pm -> pm.getProduct() != null)
                .collect(Collectors.toMap(
                        pm -> pm.getProduct().getId(),
                        pm -> pm,
                        (existing, replacement) -> existing
                ));

        List<ProductSummaryResponse> content = productPage.getContent().stream()
                .map(product -> {
                    int quantity = inventoryMap.getOrDefault(product.getId(), 0);
                    String availability = quantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
                    ProductMedia primaryMedia = primaryMediaMap.get(product.getId());
                    return productMapper.toSummaryResponse(product, availability, primaryMedia);
                })
                .toList();

        return new PageImpl<>(content, productPage.getPageable(), productPage.getTotalElements());
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
        return listProducts(keyword, group, artisan, craftVillage, minPrice, maxPrice, Pageable.unpaged()).getContent();
    }

    private void validatePriceFilters(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidFilterException("Giá tối thiểu không được nhỏ hơn 0.");
        }
        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidFilterException("Giá tối đa không được nhỏ hơn 0.");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new InvalidFilterException("Giá tối thiểu không được lớn hơn giá tối đa.");
        }
    }
}
