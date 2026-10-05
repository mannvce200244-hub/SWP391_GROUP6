package com.m4n.backend.service;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.serviceImpl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    private ProductMapper productMapper;
    private ProductService productService;

    @BeforeEach
    void setUp() {
        productMapper = new ProductMapper();
        productService = new ProductServiceImpl(productRepository, inventoryRepository, productMapper);
    }

    @Test
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
        assertThat(response.media().get(0).type()).isEqualTo("IMAGE");
        assertThat(response.media().get(1).sortOrder()).isEqualTo(2);
        assertThat(response.media().get(2).sortOrder()).isEqualTo(3);
        assertThat(response.media().get(3).sortOrder()).isEqualTo(4);
        assertThat(response.media().get(4).sortOrder()).isEqualTo(5);
        assertThat(response.media().get(4).url()).isEqualTo("/media/5.jpg");
        assertThat(response.stockQuantity()).isEqualTo(0);
    }

    @Test
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

        when(productRepository.findAllByIsActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(productWith5Media));
        when(inventoryRepository.findAll()).thenReturn(List.of());

        var summaries = productService.listProducts(null, null, null, null, null, null);

        assertThat(summaries).hasSize(1);
        assertThat(summaries.get(0).media()).hasSize(1);
        assertThat(summaries.get(0).media().get(0).url()).isEqualTo("/media/primary.jpg");
        assertThat(summaries.get(0).media().get(0).sortOrder()).isEqualTo(1);
    }

    @Test
    void shouldThrowProductNotFoundExceptionWhenProductMissing() {
        when(productRepository.findWithDetailsByIdAndIsActiveTrue(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductDetail(999L))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("999");
    }
}
