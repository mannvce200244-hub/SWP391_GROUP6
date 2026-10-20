package com.m4n.backend.service;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.exception.InvalidFilterException;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductMediaRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.serviceImpl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ProductMediaRepository productMediaRepository;

    @Mock
    private com.m4n.backend.repository.CategoryRepository categoryRepository;

    @Mock
    private com.m4n.backend.repository.ArtisanRepository artisanRepository;

    @Mock
    private com.m4n.backend.repository.CraftVillageRepository craftVillageRepository;

    private ProductMapper productMapper;
    private ProductService productService;

    @BeforeEach
    void setUp() {
        productMapper = new ProductMapper();
        productService = new ProductServiceImpl(
                productRepository,
                inventoryRepository,
                productMediaRepository,
                categoryRepository,
                artisanRepository,
                craftVillageRepository,
                productMapper
        );
    }

    @Test
    @DisplayName("Should return full product detail when product exists")
    void shouldReturnProductDetailWhenProductExists() {
        Category category = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        CraftVillage craftVillage = CraftVillage.builder().id(1L).name("Làng Đào Xá").location("Hà Nội").build();
        Artisan artisan = Artisan.builder().id(1L).name("Nghệ nhân Nguyễn Văn Quý").craftVillage(craftVillage).build();

        Product product = Product.builder()
                .id(1L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .description("Đàn tranh truyền thống")
                .material("Gỗ cẩm lai")
                .dimensions("115cm")
                .musicalRange("3 quãng tám")
                .origin("Việt Nam")
                .category(category)
                .artisan(artisan)
                .craftVillage(craftVillage)
                .isActive(true)
                .media(List.of(
                        ProductMedia.builder().id(1L).mediaType(MediaType.IMAGE).url("/media/tranh.jpg").altText("Đàn tranh").sortOrder(1).build()
                ))
                .build();

        Inventory inventory = Inventory.builder().id(1L).product(product).quantity(10).build();

        when(productRepository.findWithDetailsByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));

        ProductDetailResponse response = productService.getProductDetail(1L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.code()).isEqualTo("TRN-001");
        assertThat(response.name()).isEqualTo("Đàn Tranh 16 Dây");
        assertThat(response.price()).isEqualByComparingTo("8500000");
        assertThat(response.priceDisplay()).contains("8.500.000");
        assertThat(response.category().name()).isEqualTo("Nhạc cụ dây");
        assertThat(response.artisan().name()).isEqualTo("Nghệ nhân Nguyễn Văn Quý");
        assertThat(response.craftVillage().name()).isEqualTo("Làng Đào Xá");
        assertThat(response.media()).hasSize(1);
        assertThat(response.media().get(0).url()).isEqualTo("/media/tranh.jpg");
        assertThat(response.availability()).isEqualTo("IN_STOCK");
        assertThat(response.stockQuantity()).isEqualTo(10);
    }

    @Test
    @DisplayName("Should return OUT_OF_STOCK when inventory quantity is zero")
    void shouldReturnOutOfStockWhenInventoryIsZero() {
        Category category = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        Product product = Product.builder()
                .id(2L)
                .code("BAU-001")
                .name("Đàn Bầu")
                .price(new BigDecimal("6200000"))
                .category(category)
                .isActive(true)
                .build();

        Inventory inventory = Inventory.builder().id(2L).product(product).quantity(0).build();

        when(productRepository.findWithDetailsByIdAndIsActiveTrue(2L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByProductId(2L)).thenReturn(Optional.of(inventory));

        ProductDetailResponse response = productService.getProductDetail(2L);

        assertThat(response.availability()).isEqualTo("OUT_OF_STOCK");
        assertThat(response.stockQuantity()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should return media gallery sorted deterministically by sortOrder")
    void shouldReturnProductDetailWithMultipleMediaSorted() {
        Category category = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        Product product = Product.builder()
                .id(1L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .category(category)
                .isActive(true)
                .media(List.of(
                        ProductMedia.builder().id(5L).mediaType(MediaType.IMAGE).url("/media/5.jpg").sortOrder(5).build(),
                        ProductMedia.builder().id(2L).mediaType(MediaType.IMAGE).url("/media/2.jpg").sortOrder(2).build(),
                        ProductMedia.builder().id(4L).mediaType(MediaType.IMAGE).url("/media/4.jpg").sortOrder(4).build(),
                        ProductMedia.builder().id(1L).mediaType(MediaType.IMAGE).url("/media/1.jpg").sortOrder(1).build(),
                        ProductMedia.builder().id(3L).mediaType(MediaType.IMAGE).url("/media/3.jpg").sortOrder(3).build()
                ))
                .build();

        when(productRepository.findWithDetailsByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.empty());

        ProductDetailResponse response = productService.getProductDetail(1L);

        assertThat(response.media()).hasSize(5);
        assertThat(response.media().get(0).sortOrder()).isEqualTo(1);
        assertThat(response.media().get(0).url()).isEqualTo("/media/1.jpg");
        assertThat(response.media().get(1).sortOrder()).isEqualTo(2);
        assertThat(response.media().get(2).sortOrder()).isEqualTo(3);
        assertThat(response.media().get(3).sortOrder()).isEqualTo(4);
        assertThat(response.media().get(4).sortOrder()).isEqualTo(5);
        assertThat(response.media().get(4).url()).isEqualTo("/media/5.jpg");
        assertThat(response.stockQuantity()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should return empty media list when product has no media")
    void shouldReturnProductDetailWithZeroMedia() {
        Category category = Category.builder().id(2L).code("HOI").name("Nhạc cụ hơi").build();
        Product product = Product.builder()
                .id(5L)
                .code("TIEU-001")
                .name("Tiêu Bát Khổng Nứa Bắc")
                .price(new BigDecimal("750000"))
                .category(category)
                .isActive(true)
                .media(List.of())
                .build();

        when(productRepository.findWithDetailsByIdAndIsActiveTrue(5L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByProductId(5L)).thenReturn(Optional.empty());

        ProductDetailResponse response = productService.getProductDetail(5L);

        assertThat(response.media()).isNotNull().isEmpty();
        assertThat(response.stockQuantity()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should return only 1 primary media item in paginated product list")
    void shouldReturnOnlyPrimaryMediaInProductList() {
        Category category = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        Product productWith5Media = Product.builder()
                .id(1L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .category(category)
                .isActive(true)
                .media(List.of(
                        ProductMedia.builder().id(2L).mediaType(MediaType.IMAGE).url("/media/secondary.jpg").sortOrder(2).build(),
                        ProductMedia.builder().id(1L).mediaType(MediaType.IMAGE).url("/media/primary.jpg").sortOrder(1).build()
                ))
                .build();

        Pageable pageable = PageRequest.of(0, 9);
        Page<Product> productPage = new PageImpl<>(List.of(productWith5Media), pageable, 1);

        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);
        when(inventoryRepository.findByProductIdIn(any())).thenReturn(List.of(
                Inventory.builder().id(10L).product(productWith5Media).quantity(5).build()
        ));
        when(productMediaRepository.findByProductIdInOrderBySortOrderAsc(any())).thenReturn(List.of(
                ProductMedia.builder().id(1L).product(productWith5Media).mediaType(MediaType.IMAGE).url("/media/primary.jpg").sortOrder(1).build(),
                ProductMedia.builder().id(2L).product(productWith5Media).mediaType(MediaType.IMAGE).url("/media/secondary.jpg").sortOrder(2).build()
        ));

        Page<ProductSummaryResponse> responsePage = productService.listProducts(
                null, null, null, null, null, null, pageable
        );

        assertThat(responsePage).isNotNull();
        assertThat(responsePage.getTotalElements()).isEqualTo(1);
        assertThat(responsePage.getContent()).hasSize(1);

        ProductSummaryResponse card = responsePage.getContent().get(0);
        assertThat(card.media()).hasSize(1);
        assertThat(card.media().get(0).url()).isEqualTo("/media/primary.jpg");
        assertThat(card.media().get(0).sortOrder()).isEqualTo(1);
        assertThat(card.availability()).isEqualTo("IN_STOCK");
    }

    @Test
    @DisplayName("Should reject invalid price filters with InvalidFilterException")
    void shouldRejectInvalidPriceFilters() {
        Pageable pageable = PageRequest.of(0, 9);

        // minPrice < 0
        assertThatThrownBy(() -> productService.listProducts(null, null, null, null, new BigDecimal("-1000"), null, pageable))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessageContaining("Giá tối thiểu không được nhỏ hơn 0");

        // maxPrice < 0
        assertThatThrownBy(() -> productService.listProducts(null, null, null, null, null, new BigDecimal("-500"), pageable))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessageContaining("Giá tối đa không được nhỏ hơn 0");

        // minPrice > maxPrice
        assertThatThrownBy(() -> productService.listProducts(null, null, null, null, new BigDecimal("10000000"), new BigDecimal("5000000"), pageable))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessageContaining("Giá tối thiểu không được lớn hơn giá tối đa");
    }

    @Test
    @DisplayName("Should throw ProductNotFoundException when product ID is missing")
    void shouldThrowProductNotFoundExceptionWhenProductMissing() {
        when(productRepository.findWithDetailsByIdAndIsActiveTrue(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductDetail(999L))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("Should initialize inventory with quantity 0 when creating product")
    void shouldInitializeInventoryQuantityZeroOnProductCreate() {
        Category category = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.existsByCodeIgnoreCase("TR-001")).thenReturn(false);

        Product savedProduct = Product.builder()
                .id(100L)
                .code("TR-001")
                .name("Đàn Tranh 17 Dây")
                .category(category)
                .price(new BigDecimal("5000000"))
                .isActive(true)
                .build();
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        Inventory savedInventory = Inventory.builder()
                .id(200L)
                .product(savedProduct)
                .quantity(0)
                .build();
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
            Inventory inv = invocation.getArgument(0);
            assertThat(inv.getQuantity()).isEqualTo(0);
            return savedInventory;
        });

        com.m4n.backend.dto.request.CreateProductRequest request = new com.m4n.backend.dto.request.CreateProductRequest(
                "TR-001",
                null,
                "Đàn Tranh 17 Dây",
                new BigDecimal("5000000"),
                1L,
                null,
                null,
                "Gỗ mun",
                "120cm",
                "3 quãng tám",
                "Việt Nam",
                "Mô tả",
                null
        );

        com.m4n.backend.dto.response.AdminProductDetailResponse response = productService.createProduct(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.stockQuantity()).isEqualTo(0);
        assertThat(response.code()).isEqualTo("TR-001");
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when product code exists on create")
    void shouldRejectDuplicateProductCodeOnCreate() {
        when(productRepository.existsByCodeIgnoreCase("DUP-01")).thenReturn(true);

        com.m4n.backend.dto.request.CreateProductRequest request = new com.m4n.backend.dto.request.CreateProductRequest(
                "DUP-01",
                null,
                "Đàn Tranh Trùng Mã",
                new BigDecimal("5000000"),
                1L,
                null,
                null,
                null, null, null, null, null,
                null
        );

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class)
                .hasMessageContaining("DUP-01");
    }

    @Test
    @DisplayName("Should update owned product media metadata and display order")
    void shouldUpdateOwnedProductMediaAndDisplayOrder() {
        Product product = Product.builder().id(100L).build();
        ProductMedia media = ProductMedia.builder()
                .id(10L)
                .product(product)
                .url("/img/old.jpg")
                .mediaType(MediaType.IMAGE)
                .altText("Old")
                .sortOrder(3)
                .build();

        when(productRepository.existsById(100L)).thenReturn(true);
        when(productMediaRepository.findByIdAndProductId(10L, 100L)).thenReturn(Optional.of(media));
        when(productMediaRepository.save(media)).thenReturn(media);

        var request = new com.m4n.backend.dto.request.UpdateProductMediaRequest(
                MediaType.VIDEO,
                "/video/demo.mp4",
                "Video demo",
                0
        );

        var response = productService.updateProductMedia(100L, 10L, request);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.type()).isEqualTo("VIDEO");
        assertThat(response.url()).isEqualTo("/video/demo.mp4");
        assertThat(response.alt()).isEqualTo("Video demo");
        assertThat(response.sortOrder()).isZero();
    }

    @Test
    @DisplayName("Should delete product media item when owned by product")
    void shouldDeleteProductMediaWhenOwnedByProduct() {
        ProductMedia media = ProductMedia.builder()
                .id(10L)
                .url("/img/photo.jpg")
                .mediaType(MediaType.IMAGE)
                .sortOrder(0)
                .build();

        when(productRepository.existsById(100L)).thenReturn(true);
        when(productMediaRepository.findByIdAndProductId(10L, 100L)).thenReturn(Optional.of(media));

        productService.deleteProductMedia(100L, 10L);

        org.mockito.Mockito.verify(productMediaRepository).delete(media);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when media does not belong to product")
    void shouldThrowWhenMediaDoesNotBelongToProduct() {
        when(productRepository.existsById(100L)).thenReturn(true);
        when(productMediaRepository.findByIdAndProductId(999L, 100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.deleteProductMedia(100L, 999L))
                .isInstanceOf(com.m4n.backend.exception.ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("Should auto-generate code and EAN-13 barcode when omitted in createProduct")
    void shouldAutoGenerateCodeAndEan13BarcodeWhenOmitted() {
        Category cat = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));

        Product savedInit = Product.builder()
                .id(42L)
                .code("PENDING-uuid")
                .name("Đàn Tỳ Bà")
                .price(new BigDecimal("3500000"))
                .category(cat)
                .build();
        when(productRepository.save(any(Product.class))).thenReturn(savedInit);

        com.m4n.backend.dto.request.CreateProductRequest req = new com.m4n.backend.dto.request.CreateProductRequest(
                null, // code omitted -> auto-generate
                null, // barcode omitted -> auto-generate EAN-13
                "Đàn Tỳ Bà",
                new BigDecimal("3500000"),
                1L,
                null, null, null, null, null, null, null, null
        );

        productService.createProduct(req);

        // Verify productRepository.save was invoked and code/barcode were generated
        org.mockito.ArgumentCaptor<Product> captor = org.mockito.ArgumentCaptor.forClass(Product.class);
        org.mockito.Mockito.verify(productRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        Product finalProduct = captor.getValue();
        assertThat(finalProduct.getCode()).startsWith("M4N-DAY-");
        assertThat(finalProduct.getBarcode()).startsWith("893850");
        assertThat(finalProduct.getBarcode()).hasSize(13);
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when barcode already exists")
    void shouldThrowWhenBarcodeAlreadyExists() {
        Category cat = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(productRepository.existsByBarcodeIgnoreCase("8938501234567")).thenReturn(true);

        com.m4n.backend.dto.request.CreateProductRequest req = new com.m4n.backend.dto.request.CreateProductRequest(
                "NEW-001",
                "8938501234567",
                "Đàn Bầu",
                new BigDecimal("4500000"),
                1L,
                null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> productService.createProduct(req))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class)
                .hasMessageContaining("8938501234567");
    }
}
