package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.CreateProductMediaRequest;
import com.m4n.backend.dto.request.CreateProductRequest;
import com.m4n.backend.dto.request.UpdateProductMediaRequest;
import com.m4n.backend.dto.request.UpdateProductRequest;
import com.m4n.backend.dto.response.AdminProductDetailResponse;
import com.m4n.backend.dto.response.AdminProductSummaryResponse;
import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductMediaResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.InvalidFilterException;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.CraftVillageRepository;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductMediaRepository productMediaRepository;
    private final CategoryRepository categoryRepository;
    private final ArtisanRepository artisanRepository;
    private final CraftVillageRepository craftVillageRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            ProductMediaRepository productMediaRepository,
            CategoryRepository categoryRepository,
            ArtisanRepository artisanRepository,
            CraftVillageRepository craftVillageRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.productMediaRepository = productMediaRepository;
        this.categoryRepository = categoryRepository;
        this.artisanRepository = artisanRepository;
        this.craftVillageRepository = craftVillageRepository;
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

    @Override
    @Transactional(readOnly = true)
    public AdminProductDetailResponse getAdminProductDetail(Long productId) {
        if (productId == null) {
            throw new ProductNotFoundException("ID sản phẩm không hợp lệ");
        }

        Product product = productRepository.findWithDetailsById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        Inventory inventory = inventoryRepository.findByProductId(product.getId()).orElse(null);
        int stockQuantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        String availability = stockQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
        return productMapper.toAdminDetailResponse(product, availability, stockQuantity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminProductSummaryResponse> listAdminProducts(
            String keyword,
            Long categoryId,
            Long artisanId,
            Long craftVillageId,
            Boolean isActive,
            Pageable pageable
    ) {
        Specification<Product> spec = ProductSpecification.filterAdminProducts(
                keyword, categoryId, artisanId, craftVillageId, isActive
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

        List<AdminProductSummaryResponse> content = productPage.getContent().stream()
                .map(product -> {
                    int quantity = inventoryMap.getOrDefault(product.getId(), 0);
                    String availability = quantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
                    ProductMedia primaryMedia = primaryMediaMap.get(product.getId());
                    String primaryImage = primaryMedia != null ? primaryMedia.getUrl() : null;
                    return productMapper.toAdminSummaryResponse(product, availability, quantity, primaryImage);
                })
                .toList();

        return new PageImpl<>(content, productPage.getPageable(), productPage.getTotalElements());
    }

    @Override
    @Transactional
    public AdminProductDetailResponse createProduct(CreateProductRequest request) {
        String trimmedCode = request.code() != null ? request.code().trim() : "";
        boolean autoGenerateCode = trimmedCode.isBlank();
        if (!autoGenerateCode) {
            if (productRepository.existsByCodeIgnoreCase(trimmedCode)) {
                throw new DuplicateResourceException("Mã sản phẩm '" + trimmedCode + "' đã tồn tại trong hệ thống.", "PRODUCT_CODE_EXISTS");
            }
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.categoryId()));

        Artisan artisan = null;
        if (request.artisanId() != null) {
            artisan = artisanRepository.findById(request.artisanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghệ nhân với ID: " + request.artisanId()));
        }

        CraftVillage craftVillage = null;
        if (request.craftVillageId() != null) {
            craftVillage = craftVillageRepository.findById(request.craftVillageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với ID: " + request.craftVillageId()));
        }

        String initialCode = autoGenerateCode ? ("PENDING-" + UUID.randomUUID()) : trimmedCode;
        String trimmedBarcode = request.barcode() != null && !request.barcode().isBlank() ? request.barcode().trim() : null;
        if (trimmedBarcode != null && productRepository.existsByBarcodeIgnoreCase(trimmedBarcode)) {
            throw new DuplicateResourceException("Mã vạch '" + trimmedBarcode + "' đã tồn tại trong hệ thống.", "BARCODE_EXISTS");
        }

        Product product = Product.builder()
                .code(initialCode)
                .barcode(trimmedBarcode)
                .name(request.name().trim())
                .price(request.price())
                .description(request.description() != null ? request.description().trim() : null)
                .material(request.material() != null ? request.material().trim() : null)
                .dimensions(request.dimensions() != null ? request.dimensions().trim() : null)
                .musicalRange(request.musicalRange() != null ? request.musicalRange().trim() : null)
                .origin(request.origin() != null ? request.origin().trim() : null)
                .category(category)
                .artisan(artisan)
                .craftVillage(craftVillage)
                .isActive(true)
                .build();

        Product savedProduct = productRepository.save(product);

        // Auto-generate code and/or EAN-13 barcode if omitted
        boolean needsUpdate = false;
        if (autoGenerateCode) {
            String catPrefix = (category.getCode() != null && !category.getCode().isBlank())
                    ? category.getCode().trim().toUpperCase()
                    : "INS";
            Long prodId = savedProduct.getId() != null ? savedProduct.getId() : 1L;
            String generatedCode = String.format("M4N-%s-%04d", catPrefix, prodId);
            if (productRepository.existsByCodeIgnoreCase(generatedCode)) {
                generatedCode = String.format("M4N-%s-%06d", catPrefix, prodId);
            }
            savedProduct.setCode(generatedCode);
            needsUpdate = true;
        }

        if (savedProduct.getBarcode() == null) {
            Long prodId = savedProduct.getId() != null ? savedProduct.getId() : 1L;
            String generatedBarcode = generateEan13Barcode(prodId);
            if (!productRepository.existsByBarcodeIgnoreCase(generatedBarcode)) {
                savedProduct.setBarcode(generatedBarcode);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            savedProduct = productRepository.save(savedProduct);
        }

        // BR-INVENTORY: Initialize inventory to 0, no fabricated stock
        Inventory inventory = Inventory.builder()
                .product(savedProduct)
                .quantity(0)
                .build();
        inventoryRepository.save(inventory);

        // Save initial media if supplied
        if (request.media() != null && !request.media().isEmpty()) {
            int order = 1;
            for (CreateProductMediaRequest mReq : request.media()) {
                if (mReq != null && mReq.url() != null && !mReq.url().isBlank()) {
                    ProductMedia media = ProductMedia.builder()
                            .product(savedProduct)
                            .mediaType(mReq.mediaType() != null ? mReq.mediaType() : MediaType.IMAGE)
                            .url(mReq.url().trim())
                            .altText(mReq.altText() != null ? mReq.altText().trim() : null)
                            .sortOrder(mReq.sortOrder() != null ? mReq.sortOrder() : order++)
                            .build();
                    productMediaRepository.save(media);
                    savedProduct.getMedia().add(media);
                }
            }
        }

        return productMapper.toAdminDetailResponse(savedProduct, "OUT_OF_STOCK", 0);
    }

    private String generateEan13Barcode(Long id) {
        long safeId = id != null ? Math.abs(id) : 1L;
        String base12 = String.format("893850%06d", safeId % 1_000_000L);
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = Character.getNumericValue(base12.charAt(i));
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int checksum = (10 - (sum % 10)) % 10;
        return base12 + checksum;
    }

    @Override
    @Transactional
    public AdminProductDetailResponse updateProduct(Long productId, UpdateProductRequest request) {
        Product product = productRepository.findWithDetailsById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.categoryId()));

        Artisan artisan = null;
        if (request.artisanId() != null) {
            artisan = artisanRepository.findById(request.artisanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghệ nhân với ID: " + request.artisanId()));
        }

        CraftVillage craftVillage = null;
        if (request.craftVillageId() != null) {
            craftVillage = craftVillageRepository.findById(request.craftVillageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với ID: " + request.craftVillageId()));
        }

        String trimmedBarcode = request.barcode() != null && !request.barcode().isBlank() ? request.barcode().trim() : null;
        if (trimmedBarcode != null && productRepository.existsByBarcodeIgnoreCaseAndIdNot(trimmedBarcode, productId)) {
            throw new DuplicateResourceException("Mã vạch '" + trimmedBarcode + "' đã tồn tại trong hệ thống.", "BARCODE_EXISTS");
        }

        product.setName(request.name().trim());
        product.setPrice(request.price());
        product.setCategory(category);
        product.setArtisan(artisan);
        product.setCraftVillage(craftVillage);
        product.setBarcode(trimmedBarcode);
        product.setMaterial(request.material() != null ? request.material().trim() : null);
        product.setDimensions(request.dimensions() != null ? request.dimensions().trim() : null);
        product.setMusicalRange(request.musicalRange() != null ? request.musicalRange().trim() : null);
        product.setOrigin(request.origin() != null ? request.origin().trim() : null);
        product.setDescription(request.description() != null ? request.description().trim() : null);
        if (request.isActive() != null) {
            product.setActive(request.isActive());
        }

        Product savedProduct = productRepository.save(product);

        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        int stockQuantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        String availability = stockQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";

        return productMapper.toAdminDetailResponse(savedProduct, availability, stockQuantity);
    }

    @Override
    @Transactional
    public AdminProductDetailResponse updateProductStatus(Long productId, boolean isActive) {
        Product product = productRepository.findWithDetailsById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        product.setActive(isActive);
        Product savedProduct = productRepository.save(product);

        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        int stockQuantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        String availability = stockQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";

        return productMapper.toAdminDetailResponse(savedProduct, availability, stockQuantity);
    }

    @Override
    @Transactional
    public ProductMediaResponse addProductMedia(Long productId, CreateProductMediaRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        int sortOrder;
        if (request.sortOrder() != null) {
            sortOrder = request.sortOrder();
        } else {
            List<ProductMedia> existing = productMediaRepository.findByProductIdOrderBySortOrderAsc(productId);
            sortOrder = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getSortOrder() + 1;
        }

        ProductMedia media = ProductMedia.builder()
                .product(product)
                .mediaType(request.mediaType() != null ? request.mediaType() : MediaType.IMAGE)
                .url(request.url().trim())
                .altText(request.altText() != null ? request.altText().trim() : null)
                .sortOrder(sortOrder)
                .build();

        ProductMedia saved = productMediaRepository.save(media);
        return productMapper.toProductMediaResponse(saved);
    }

    @Override
    @Transactional
    public ProductMediaResponse updateProductMedia(Long productId, Long mediaId, UpdateProductMediaRequest request) {
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException(productId);
        }

        ProductMedia media = productMediaRepository.findByIdAndProductId(mediaId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy media ID " + mediaId + " thuộc sản phẩm ID " + productId));

        if (request.mediaType() != null) {
            media.setMediaType(request.mediaType());
        }
        if (request.url() != null && !request.url().isBlank()) {
            media.setUrl(request.url().trim());
        }
        if (request.altText() != null) {
            media.setAltText(request.altText().trim());
        }
        if (request.sortOrder() != null) {
            media.setSortOrder(request.sortOrder());
        }

        ProductMedia saved = productMediaRepository.save(media);
        return productMapper.toProductMediaResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProductMedia(Long productId, Long mediaId) {
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException(productId);
        }

        ProductMedia media = productMediaRepository.findByIdAndProductId(mediaId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy media ID " + mediaId + " thuộc sản phẩm ID " + productId));

        productMediaRepository.delete(media);
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
