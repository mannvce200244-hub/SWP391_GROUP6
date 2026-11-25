package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.CreateProductMediaRequest;
import com.m4n.backend.dto.request.CreateProductRequest;
import com.m4n.backend.dto.request.CreateProductVariantsRequest;
import com.m4n.backend.dto.request.UpdateProductMediaRequest;
import com.m4n.backend.dto.request.UpdateProductRequest;
import com.m4n.backend.dto.request.ProductMediaItemRequest;
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
import com.m4n.backend.service.ProductPricingService;
import com.m4n.backend.specification.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.ArrayList;
import java.util.HashSet;
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
    private final ProductPricingService productPricingService;
    private final com.m4n.backend.repository.ProductFamilyRepository familyRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            ProductMediaRepository productMediaRepository,
            CategoryRepository categoryRepository,
            ArtisanRepository artisanRepository,
            CraftVillageRepository craftVillageRepository,
            ProductMapper productMapper,
            ProductPricingService productPricingService,
            com.m4n.backend.repository.ProductFamilyRepository familyRepository
    ) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.productMediaRepository = productMediaRepository;
        this.categoryRepository = categoryRepository;
        this.artisanRepository = artisanRepository;
        this.craftVillageRepository = craftVillageRepository;
        this.productMapper = productMapper;
        this.productPricingService = productPricingService;
        this.familyRepository = familyRepository;
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
        String availability = availabilityFor(product, stockQuantity);
        return productMapper.toDetailResponse(product, availability, stockQuantity, productPricingService.resolvePrices(List.of(product)).get(product.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> listVariants(Long productId, Pageable pageable) {
        Product selected = productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        return variantPage(selected, pageable, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> listAdminVariants(Long productId, Pageable pageable) {
        Product selected = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        return variantPage(selected, pageable, false);
    }

    private Page<ProductSummaryResponse> variantPage(Product selected, Pageable pageable, boolean activeOnly) {
        if (pageable.getOffset() > Integer.MAX_VALUE || pageable.getSort().isSorted()) {
            throw new IllegalArgumentException("Trang biến thể không hợp lệ.");
        }
        Specification<Product> family = (root, query, cb) -> cb.and(activeOnly ? cb.isTrue(root.get("isActive")) : cb.conjunction(),
                selected.getFamily() != null ? cb.equal(root.get("family").get("id"), selected.getFamily().getId())
                : selected.getVariantGroup() == null ? cb.equal(root.get("id"), selected.getId())
                    : cb.equal(cb.lower(root.get("variantGroup")), selected.getVariantGroup().toLowerCase(java.util.Locale.ROOT)));
        return catalogPage(productRepository.findAll(family, PageRequest.of(pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), 100), Sort.by("variantLabel").and(Sort.by("id")))));
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
        return listProducts(keyword, group, artisan, craftVillage, minPrice, maxPrice, pageable, false);
    }

    @Override @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> listProducts(String keyword, String group, String artisan, String craftVillage,
            BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable, boolean groupVariants) {
        validateProductSort(pageable);
        validatePriceFilters(minPrice, maxPrice);

        Specification<Product> spec = ProductSpecification.filterCatalog(
                keyword, group, artisan, craftVillage, minPrice, maxPrice, pageable != null ? pageable.getSort() : Sort.unsorted()
        );

        if (groupVariants) spec = ProductSpecification.familyRepresentatives(spec,
                ProductSpecification.filterCatalog(keyword, group, artisan, craftVillage, minPrice, maxPrice, Sort.unsorted()));
        Pageable catalogPageable = pageable != null ? pageable : Pageable.unpaged();
        if (catalogPageable.getSort().getOrderFor("price") != null) {
            catalogPageable = catalogPageable.isPaged() ? PageRequest.of(catalogPageable.getPageNumber(), catalogPageable.getPageSize()) : Pageable.unpaged();
        }
        Page<Product> productPage = productRepository.findAll(spec, catalogPageable);
        return catalogPage(productPage, groupVariants);
    }

    private Page<ProductSummaryResponse> catalogPage(Page<Product> productPage) {
        return catalogPage(productPage, false);
    }

    private Map<Long, ProductRepository.FamilyInventoryTotals> familyTotals(List<Product> products, boolean activeOnly) {
        var ids = products.stream().filter(product -> product.getFamily() != null).map(product -> product.getFamily().getId()).distinct().toList();
        return ids.isEmpty() ? Map.of() : (activeOnly ? productRepository.activeFamilyInventoryTotals(ids) : productRepository.familyInventoryTotals(ids)).stream()
                .collect(Collectors.toMap(ProductRepository.FamilyInventoryTotals::getFamilyId, value -> value));
    }

    private String familyAvailability(long quantity, long ignoredThreshold) {
        return quantity <= 0 ? "OUT_OF_STOCK" : quantity <= Inventory.LOW_STOCK_THRESHOLD ? "LOW_STOCK" : "IN_STOCK";
    }

    private Page<ProductSummaryResponse> catalogPage(Page<Product> productPage, boolean grouped) {
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
                : productMediaRepository.findByProductIdInOrderBySortOrderAscIdAsc(productIds).stream()
                .filter(pm -> pm.getProduct() != null)
                .filter(pm -> pm.getMediaType() == null || pm.getMediaType() == MediaType.IMAGE)
                .collect(Collectors.toMap(
                        pm -> pm.getProduct().getId(),
                        pm -> pm,
                        (existing, replacement) -> existing
                ));

        var totals = grouped ? familyTotals(productPage.getContent(), true) : Map.<Long, ProductRepository.FamilyInventoryTotals>of();
        var resolvedPrices = productPricingService.resolvePrices(productPage.getContent());
        List<ProductSummaryResponse> content = productPage.getContent().stream()
                .map(product -> {
                    int quantity = inventoryMap.getOrDefault(product.getId(), 0);
                    String availability = availabilityFor(product, quantity);
                    ProductMedia primaryMedia = primaryMediaMap.get(product.getId());
                    var total = product.getFamily() == null ? null : totals.get(product.getFamily().getId());
                    if (total != null) return productMapper.toSummaryResponse(product,
                            familyAvailability(total.getQuantity(), total.getThreshold()), primaryMedia, resolvedPrices.get(product.getId()), total.getQuantity(), total.getVariantCount());
                    return productMapper.toSummaryResponse(product, availability, primaryMedia, resolvedPrices.get(product.getId()), quantity);
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
        String availability = availabilityFor(product, stockQuantity);
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
        return listAdminProducts(keyword, categoryId, artisanId, craftVillageId, isActive, pageable, false);
    }

    @Override @Transactional(readOnly = true)
    public Page<AdminProductSummaryResponse> listAdminProducts(String keyword, Long categoryId, Long artisanId,
            Long craftVillageId, Boolean isActive, Pageable pageable, boolean groupVariants) {
        validateAdminProductSort(pageable);
        Specification<Product> spec = ProductSpecification.filterAdminProducts(
                keyword, categoryId, artisanId, craftVillageId, isActive
        );

        if (groupVariants) spec = ProductSpecification.familyRepresentatives(spec, spec);
        Pageable effectivePageable = pageable != null ? pageable : Pageable.unpaged();
        Sort.Order stockOrder = effectivePageable.getSort().getOrderFor("stockQuantity");
        if (stockOrder == null) stockOrder = effectivePageable.getSort().getOrderFor("quantity");
        if (stockOrder != null) {
            spec = spec.and(ProductSpecification.orderByStock(groupVariants, stockOrder.isAscending()));
            effectivePageable = effectivePageable.isPaged()
                    ? PageRequest.of(effectivePageable.getPageNumber(), effectivePageable.getPageSize())
                    : Pageable.unpaged();
        }
        Page<Product> productPage = productRepository.findAll(spec, effectivePageable);
        var totals = groupVariants ? familyTotals(productPage.getContent(), false) : Map.<Long, ProductRepository.FamilyInventoryTotals>of();

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
                : productMediaRepository.findByProductIdInOrderBySortOrderAscIdAsc(productIds).stream()
                .filter(pm -> pm.getProduct() != null)
                .filter(pm -> pm.getMediaType() == null || pm.getMediaType() == MediaType.IMAGE)
                .collect(Collectors.toMap(
                        pm -> pm.getProduct().getId(),
                        pm -> pm,
                        (existing, replacement) -> existing
                ));

        List<AdminProductSummaryResponse> content = productPage.getContent().stream()
                .map(product -> {
                    int quantity = inventoryMap.getOrDefault(product.getId(), 0);
                    String availability = availabilityFor(product, quantity);
                    ProductMedia primaryMedia = primaryMediaMap.get(product.getId());
                    String primaryImage = primaryMedia != null ? primaryMedia.getUrl() : null;
                    var total = product.getFamily() == null ? null : totals.get(product.getFamily().getId());
                    if (total != null) return productMapper.toAdminSummaryResponse(product,
                            familyAvailability(total.getQuantity(), total.getThreshold()), total.getQuantity(), primaryImage, total.getVariantCount(), total.getActiveCount() > 0);
                    return productMapper.toAdminSummaryResponse(product, availability, quantity, primaryImage);
                })
                .toList();

        return new PageImpl<>(content, productPage.getPageable(), productPage.getTotalElements());
    }

    @Override
    @Transactional
    public List<AdminProductDetailResponse> createVariants(CreateProductVariantsRequest request) {
        if (request.variants() == null || request.variants().isEmpty() || request.variants().getFirst() == null) {
            throw new IllegalArgumentException("Thêm ít nhất một biến thể.");
        }
        var first = request.variants().getFirst();
        String group = first.variantGroup();
        String normalized = group == null ? null : java.text.Normalizer.normalize(group.trim(), java.text.Normalizer.Form.NFC);
        String firstOpt1Name = normalizeOption(first.option1Name(), "Tên nhóm phân loại 1 tối đa 48 ký tự.");
        String firstOpt2Name = normalizeOption(first.option2Name(), "Tên nhóm phân loại 2 tối đa 48 ký tự.");
        validateOptionNames(firstOpt1Name, firstOpt2Name);
        for (CreateProductRequest variant : request.variants()) {
            if (variant == null || !java.util.Objects.equals(first.familyId(), variant.familyId())
                    || (normalized != null && (variant.variantGroup() == null || !normalized.equalsIgnoreCase(
                    java.text.Normalizer.normalize(variant.variantGroup().trim(), java.text.Normalizer.Form.NFC))))) {
                throw new IllegalArgumentException("Các biến thể phải thuộc cùng một nhóm sản phẩm.");
            }
            String rowOpt1Name = normalizeOption(variant.option1Name(), "Tên nhóm phân loại 1 tối đa 48 ký tự.");
            String rowOpt2Name = normalizeOption(variant.option2Name(), "Tên nhóm phân loại 2 tối đa 48 ký tự.");
            if ((rowOpt1Name != null && firstOpt1Name != null && !firstOpt1Name.equalsIgnoreCase(rowOpt1Name))
                    || (rowOpt2Name != null && firstOpt2Name != null && !firstOpt2Name.equalsIgnoreCase(rowOpt2Name))) {
                throw new IllegalArgumentException("Các biến thể phải dùng chung tên nhóm phân loại.");
            }
            boolean hasLabel = variant.variantLabel() != null && !variant.variantLabel().isBlank();
            boolean hasOpt1 = variant.option1Value() != null && !variant.option1Value().isBlank();
            if (!hasLabel && !hasOpt1) throw new IllegalArgumentException("Nhập tên cho từng biến thể.");
        }
        var family = familyFor(first.familyId(), first.variantGroup(), first.name(), firstOpt1Name, firstOpt2Name);
        List<AdminProductDetailResponse> created = new ArrayList<>();
        for (CreateProductRequest variant : request.variants()) created.add(createProduct(variant, family));
        return created;
    }

    @Override
    @Transactional
    public AdminProductDetailResponse createProduct(CreateProductRequest request) {
        String opt1Name = normalizeOption(request.option1Name(), "Tên nhóm phân loại 1 tối đa 48 ký tự.");
        String opt2Name = normalizeOption(request.option2Name(), "Tên nhóm phân loại 2 tối đa 48 ký tự.");
        validateOptionNames(opt1Name, opt2Name);
        boolean hasLabel = request.variantLabel() != null && !request.variantLabel().isBlank();
        boolean hasOpt1 = request.option1Value() != null && !request.option1Value().isBlank();
        if (request.familyId() != null && !hasLabel && !hasOpt1) {
            throw new IllegalArgumentException("Nhập tên biến thể mới.");
        }
        return createProduct(request, familyFor(request.familyId(), request.variantGroup(), request.name(), opt1Name, opt2Name));
    }

    private com.m4n.backend.entity.ProductFamily familyFor(Long familyId, String group, String name, String opt1Name, String opt2Name) {
        if (familyId != null) {
            var existing = familyRepository.findByIdWithLock(familyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm cha không tồn tại."));
            applyFamilyOptionNames(existing, opt1Name, opt2Name);
            return existing;
        }
        String key = group == null || group.isBlank() ? null : "group:" + java.text.Normalizer.normalize(group.trim(), java.text.Normalizer.Form.NFC).toLowerCase(java.util.Locale.ROOT);
        if (key != null) {
            var existing = familyRepository.findByLegacyKey(key);
            if (existing.isPresent()) {
                var locked = familyRepository.findByIdWithLock(existing.get().getId()).orElseThrow();
                applyFamilyOptionNames(locked, opt1Name, opt2Name);
                return locked;
            }
        }
        return familyRepository.save(com.m4n.backend.entity.ProductFamily.builder()
                .name(name.trim()).option1Name(opt1Name).option2Name(opt2Name).legacyKey(key).build());
    }

    private void applyFamilyOptionNames(com.m4n.backend.entity.ProductFamily family, String opt1Name, String opt2Name) {
        if (opt1Name == null && opt2Name == null) return;
        if (family.getOption2Name() == null && opt2Name != null && productRepository.countByFamilyId(family.getId()) > 0) {
            throw new IllegalArgumentException("Thêm nhóm 2 trong phần chỉnh sửa và chọn giá trị cho từng SKU hiện có.");
        }
        validateOptionNames(opt1Name != null ? opt1Name : family.getOption1Name(), opt2Name != null ? opt2Name : family.getOption2Name());
        if (family.getOption1Name() == null && opt1Name != null) family.setOption1Name(opt1Name);
        if (family.getOption2Name() == null && opt2Name != null) family.setOption2Name(opt2Name);
    }

    private AdminProductDetailResponse createProduct(CreateProductRequest request, com.m4n.backend.entity.ProductFamily family) {
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
                .family(family)
                .price(request.price())
                .billableWeightKg(request.billableWeightKg())
                .bulkySurcharge(request.bulkySurcharge() != null ? request.bulkySurcharge() : BigDecimal.ZERO)
                .lowStockThreshold(Inventory.LOW_STOCK_THRESHOLD)
                .description(request.description() != null ? request.description().trim() : null)
                .material(request.material() != null ? request.material().trim() : null)
                .dimensions(request.dimensions() != null ? request.dimensions().trim() : null)
                .musicalRange(request.musicalRange() != null ? request.musicalRange().trim() : null)
                .origin(request.origin() != null ? request.origin().trim() : null)
                .category(category)
                .artisan(artisan)
                .craftVillage(craftVillage)
                .isActive(!Boolean.FALSE.equals(request.isActive()))
                .build();

        configureVariant(product, request.variantGroup(), request.variantLabel(), request.option1Value(), request.option2Value());
        Product savedProduct = productRepository.save(product);
        if (family != null && org.hibernate.Hibernate.isInitialized(family.getVariants())) family.getVariants().add(savedProduct);

        // Auto-generate code and/or EAN-13 barcode if omitted
        boolean needsUpdate = false;
        if (autoGenerateCode) {
            String catPrefix = (category.getCode() != null && !category.getCode().isBlank())
                    ? category.getCode().trim().toUpperCase(java.util.Locale.ROOT)
                    : "INS";
            Long prodId = savedProduct.getId() != null ? savedProduct.getId() : 1L;
            int prefixLimit = 50 - 5 - Math.max(4, prodId.toString().length());
            catPrefix = catPrefix.substring(0, Math.min(catPrefix.length(), prefixLimit));
            String generatedCode = String.format("M4N-%s-%04d", catPrefix, prodId);
            if (productRepository.existsByCodeIgnoreCase(generatedCode)) {
                generatedCode = "M4N-" + UUID.randomUUID().toString().toUpperCase(java.util.Locale.ROOT);
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

    private void configureVariant(Product product, String group, String label, String rawOption1Value, String rawOption2Value) {
        String normalizedGroup = group == null || group.isBlank() ? null
                : java.text.Normalizer.normalize(group.trim(), java.text.Normalizer.Form.NFC);
        String normalizedLabel = label == null || label.isBlank() ? null
                : java.text.Normalizer.normalize(label.trim(), java.text.Normalizer.Form.NFC);
        String opt1Val = normalizeOption(rawOption1Value, "Giá trị phân loại 1 tối đa 48 ký tự.");
        String opt2Val = normalizeOption(rawOption2Value, "Giá trị phân loại 2 tối đa 48 ký tự.");
        if (opt2Val != null && opt1Val == null) {
            throw new IllegalArgumentException("Cần nhập giá trị phân loại 1 trước giá trị phân loại 2.");
        }
        String familyOpt1 = product.getFamily() == null ? null : product.getFamily().getOption1Name();
        String familyOpt2 = product.getFamily() == null ? null : product.getFamily().getOption2Name();
        if (familyOpt1 != null && opt1Val == null) {
            throw new IllegalArgumentException("Vui lòng nhập giá trị cho nhóm phân loại '" + familyOpt1 + "'.");
        }
        if (familyOpt2 != null && opt2Val == null) {
            throw new IllegalArgumentException("Vui lòng nhập giá trị cho nhóm phân loại '" + familyOpt2 + "'.");
        }
        if (familyOpt2 == null && opt2Val != null) {
            throw new IllegalArgumentException("Cần khai báo tên nhóm phân loại 2 trước khi nhập giá trị phân loại 2.");
        }
        if (opt1Val != null) {
            normalizedLabel = opt2Val != null ? opt1Val + " · " + opt2Val : opt1Val;
        }
        if (normalizedGroup != null && normalizedLabel == null) {
            throw new IllegalArgumentException("Nhập tên biến thể cho sản phẩm này.");
        }
        if ((normalizedGroup != null && normalizedGroup.length() > 100) || (normalizedLabel != null && normalizedLabel.length() > 100)) {
            throw new IllegalArgumentException("Nhóm và tên biến thể tối đa 100 ký tự.");
        }
        boolean duplicate = normalizedLabel != null && (product.getFamily() != null
                ? productRepository.existsByFamilyIdAndVariantLabelIgnoreCaseAndIdNot(product.getFamily().getId(), normalizedLabel, product.getId() == null ? -1L : product.getId())
                : normalizedGroup != null && productRepository.existsByVariantGroupIgnoreCaseAndVariantLabelIgnoreCaseAndIdNot(normalizedGroup, normalizedLabel, product.getId() == null ? -1L : product.getId()));
        if (duplicate) {
            throw new DuplicateResourceException("Biến thể này đã có trong nhóm sản phẩm.", "PRODUCT_VARIANT_EXISTS");
        }
        product.setVariantGroup(normalizedGroup);
        product.setVariantLabel(normalizedLabel);
        product.setOption1Value(opt1Val);
        product.setOption2Value(opt2Val);
    }

    private String normalizeOption(String raw, String lengthError) {
        if (raw == null || raw.isBlank()) return null;
        String value = java.text.Normalizer.normalize(raw.trim(), java.text.Normalizer.Form.NFC);
        if (value.length() > 48) throw new IllegalArgumentException(lengthError);
        return value;
    }

    private void validateOptionNames(String opt1Name, String opt2Name) {
        if (opt2Name != null && opt1Name == null) {
            throw new IllegalArgumentException("Cần nhập tên nhóm phân loại 1 trước khi dùng nhóm phân loại 2.");
        }
        if (opt1Name != null && opt2Name != null && opt1Name.equalsIgnoreCase(opt2Name)) {
            throw new IllegalArgumentException("Hai nhóm phân loại không được trùng tên.");
        }
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
        // Lock parent before SKU: a second-option transition also updates sibling labels.
        productRepository.findFamilyIdByProductId(productId).ifPresent(id -> familyRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm cha không tồn tại.")));
        Product product = productRepository.findByIdWithLock(productId)
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
        String opt1Name = normalizeOption(request.option1Name(), "Tên nhóm phân loại 1 tối đa 48 ký tự.");
        String opt2Name = normalizeOption(request.option2Name(), "Tên nhóm phân loại 2 tối đa 48 ký tự.");
        validateOptionNames(opt1Name, opt2Name);
        if (product.getFamily() == null) product.setFamily(familyFor(null, request.variantGroup(), request.name(), null, null));
        var lockedFamily = familyRepository.findByIdWithLock(product.getFamily().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm cha không tồn tại."));
        if (request.option1Assignments() != null && (lockedFamily.getOption1Name() != null || opt1Name == null)) {
            throw new IllegalArgumentException("Phân loại đã thay đổi. Vui lòng tải lại sản phẩm trước khi thiết lập nhóm 1.");
        }
        if (request.option2Assignments() != null && (lockedFamily.getOption2Name() != null || opt2Name == null)) {
            throw new IllegalArgumentException("Phân loại đã thay đổi. Vui lòng tải lại sản phẩm trước khi thêm nhóm 2.");
        }
        product.getFamily().setName(request.name().trim());
        if (opt1Name != null || opt2Name != null) {
            var family = product.getFamily();
            String currentOpt1 = family.getOption1Name();
            String currentOpt2 = family.getOption2Name();
            boolean addingFirst = currentOpt1 == null && opt1Name != null;
            boolean addingSecond = currentOpt2 == null && opt2Name != null;
            if (addingFirst || addingSecond) {
                assignExistingOptions(product, request, addingFirst, addingSecond);
            }
            if (currentOpt2 != null && opt2Name == null && family.getId() != null
                    && productRepository.existsByFamilyIdAndOption2ValueIsNotNullAndIdNot(family.getId(), productId)) {
                throw new IllegalArgumentException("Không thể bỏ nhóm phân loại 2 khi các biến thể khác đang sử dụng.");
            }
            family.setOption1Name(opt1Name);
            family.setOption2Name(opt2Name);
        }
        String effectiveOpt1Value = request.option1Value() != null || request.option2Value() != null
                ? request.option1Value()
                : (request.variantLabel() == null ? product.getOption1Value() : null);
        String effectiveOpt2Value = request.option1Value() != null || request.option2Value() != null
                ? request.option2Value()
                : (request.variantLabel() == null ? product.getOption2Value() : null);
        configureVariant(product, request.variantGroup(), request.variantLabel(), effectiveOpt1Value, effectiveOpt2Value);
        product.setPrice(request.price());
        product.setBillableWeightKg(request.billableWeightKg());
        product.setBulkySurcharge(request.bulkySurcharge() != null ? request.bulkySurcharge() : BigDecimal.ZERO);
        product.setLowStockThreshold(Inventory.LOW_STOCK_THRESHOLD);
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
        if (request.media() != null) {
            synchronizeProductMedia(product, request.media());
        }

        Product savedProduct = productRepository.save(product);
        productRepository.flush();

        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        int stockQuantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        String availability = availabilityFor(product, stockQuantity);

        return productMapper.toAdminDetailResponse(savedProduct, availability, stockQuantity);
    }

    private void assignExistingOptions(Product selected, UpdateProductRequest request, boolean addingFirst, boolean addingSecond) {
        var siblings = productRepository.findByFamilyIdOrderByIdAsc(selected.getFamily().getId());
        var firstAssignments = request.option1Assignments();
        var secondAssignments = request.option2Assignments();
        if (siblings.size() == 1 && firstAssignments == null && secondAssignments == null) return;
        var ids = siblings.stream().map(Product::getId).collect(Collectors.toSet());
        if (addingFirst && (firstAssignments == null || !firstAssignments.keySet().equals(ids))) {
            throw new IllegalArgumentException("Chọn giá trị nhóm 1 cho đầy đủ các SKU hiện có. Vui lòng tải lại nếu danh sách đã thay đổi.");
        }
        if (addingSecond && (secondAssignments == null || !secondAssignments.keySet().equals(ids))) {
            throw new IllegalArgumentException("Chọn giá trị nhóm 2 cho đầy đủ các SKU hiện có. Vui lòng tải lại nếu danh sách đã thay đổi.");
        }
        var normalizedFirst = new java.util.HashMap<Long, String>();
        var normalizedSecond = new java.util.HashMap<Long, String>();
        var labels = new java.util.HashSet<String>();
        for (Product sibling : siblings) {
            String rawFirst = addingFirst ? firstAssignments.get(sibling.getId())
                    : (sibling.getId().equals(selected.getId()) ? request.option1Value() : sibling.getOption1Value());
            String first = normalizeOption(rawFirst,
                    "Giá trị phân loại 1 tối đa 48 ký tự.");
            String second = addingSecond ? normalizeOption(secondAssignments.get(sibling.getId()), "Giá trị phân loại 2 tối đa 48 ký tự.") : null;
            if (first == null || (addingSecond && second == null)) {
                throw new IllegalArgumentException("Mỗi SKU cần có đủ giá trị của các nhóm phân loại.");
            }
            String label = (addingSecond ? first + " · " + second : first).toLowerCase(java.util.Locale.ROOT);
            if (!labels.add(label)) throw new IllegalArgumentException("Tổ hợp biến thể bị trùng trong danh sách.");
            normalizedFirst.put(sibling.getId(), first);
            normalizedSecond.put(sibling.getId(), second);
        }
        String selectedFirst = normalizeOption(request.option1Value(), "Giá trị phân loại 1 tối đa 48 ký tự.");
        String selectedSecond = normalizeOption(request.option2Value(), "Giá trị phân loại 2 tối đa 48 ký tự.");
        if (!normalizedFirst.get(selected.getId()).equals(selectedFirst)
                || (addingSecond && !normalizedSecond.get(selected.getId()).equals(selectedSecond))) {
            throw new IllegalArgumentException("Giá trị của SKU đang sửa chưa khớp với bảng phân loại.");
        }
        // Release old labels inside this transaction so renamed SKUs can reuse one another's labels.
        String temporaryPrefix = "classification-" + java.util.UUID.randomUUID() + "-";
        for (Product sibling : siblings) sibling.setVariantLabel(temporaryPrefix + sibling.getId());
        productRepository.flush();
        for (Product sibling : siblings) {
            if (sibling.getId().equals(selected.getId())) continue;
            sibling.setOption1Value(normalizedFirst.get(sibling.getId()));
            sibling.setOption2Value(normalizedSecond.get(sibling.getId()));
            sibling.setVariantLabel(addingSecond ? sibling.getOption1Value() + " · " + sibling.getOption2Value() : sibling.getOption1Value());
        }
    }

    @Override
    @Transactional
    public AdminProductDetailResponse updateProductStatus(Long productId, boolean isActive) {
        Product product = productRepository.findByIdWithLock(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        product.setActive(isActive);
        Product savedProduct = productRepository.save(product);

        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        int stockQuantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        String availability = availabilityFor(product, stockQuantity);

        return productMapper.toAdminDetailResponse(savedProduct, availability, stockQuantity);
    }

    private void synchronizeProductMedia(Product product, List<ProductMediaItemRequest> requests) {
        Map<Long, ProductMedia> existingById = product.getMedia().stream()
                .collect(Collectors.toMap(ProductMedia::getId, media -> media));
        HashSet<Long> requestedIds = new HashSet<>();
        List<ProductMedia> gallery = new ArrayList<>();
        for (int index = 0; index < requests.size(); index++) {
            ProductMediaItemRequest request = requests.get(index);
            ProductMedia media;
            if (request.id() == null) {
                media = ProductMedia.builder().product(product).build();
            } else {
                if (!requestedIds.add(request.id())) {
                    throw new IllegalArgumentException("Danh sách media chứa ID bị trùng.");
                }
                media = existingById.get(request.id());
                if (media == null) {
                    throw new ResourceNotFoundException("Media không thuộc sản phẩm đang chỉnh sửa.");
                }
            }
            media.setMediaType(request.mediaType() != null ? request.mediaType()
                    : (media.getMediaType() != null ? media.getMediaType() : MediaType.IMAGE));
            media.setUrl(request.url().trim());
            media.setAltText(request.altText() != null ? request.altText().trim() : null);
            media.setSortOrder(request.sortOrder() != null ? request.sortOrder() : index);
            gallery.add(media);
        }
        product.getMedia().clear();
        product.getMedia().addAll(gallery);
    }

    @Override
    @Transactional
    public ProductMediaResponse addProductMedia(Long productId, CreateProductMediaRequest request) {
        Product product = productRepository.findByIdWithLock(productId)
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
        productRepository.findByIdWithLock(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

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
        productRepository.findByIdWithLock(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        ProductMedia media = productMediaRepository.findByIdAndProductId(mediaId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy media ID " + mediaId + " thuộc sản phẩm ID " + productId));

        productMediaRepository.delete(media);
    }

    private void validateProductSort(Pageable pageable) {
        if (pageable == null) return;
        if (pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        var allowed = java.util.Set.of("id", "code", "name", "price", "createdAt", "updatedAt");
        if (pageable.getSort().stream().anyMatch(order -> !allowed.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp sản phẩm không hợp lệ.");
        }
    }

    private void validateAdminProductSort(Pageable pageable) {
        if (pageable == null) return;
        if (pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        var allowed = java.util.Set.of("id", "code", "name", "price", "createdAt", "updatedAt", "stockQuantity", "quantity");
        if (pageable.getSort().stream().anyMatch(order -> !allowed.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp sản phẩm không hợp lệ.");
        }
    }

    private String availabilityFor(Product product, int quantity) {
        if (quantity <= 0) return "OUT_OF_STOCK";
        return quantity <= Inventory.LOW_STOCK_THRESHOLD ? "LOW_STOCK" : "IN_STOCK";
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
