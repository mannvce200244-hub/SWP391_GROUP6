package com.m4n.backend.service;

import com.m4n.backend.dto.response.CraftVillageSummaryResponse;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.service.serviceImpl.CraftVillageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CraftVillageServiceTest {

    @Mock
    private CraftVillageRepository craftVillageRepository;

    @Mock
    private com.m4n.backend.repository.ArtisanRepository artisanRepository;

    @Mock
    private com.m4n.backend.repository.ProductRepository productRepository;

    @Mock
    private com.m4n.backend.repository.ArticleRepository articleRepository;

    private ProductMapper productMapper;
    private CraftVillageService craftVillageService;

    @BeforeEach
    void setUp() {
        productMapper = new ProductMapper();
        craftVillageService = new CraftVillageServiceImpl(craftVillageRepository, productMapper, artisanRepository, productRepository, articleRepository);
    }

    @Test
    void shouldPreserveVillageLinkedToContent() {
        when(craftVillageRepository.findById(7L)).thenReturn(Optional.of(CraftVillage.builder().id(7L).name("Làng nghề").build()));
        when(articleRepository.existsByCraftVillageId(7L)).thenReturn(true);
        assertThatThrownBy(() -> craftVillageService.deleteCraftVillage(7L)).isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class);
        verify(craftVillageRepository, org.mockito.Mockito.never()).delete(org.mockito.ArgumentMatchers.any(CraftVillage.class));
    }

    @Test
    void shouldReturnAllCraftVillages() {
        CraftVillage village1 = CraftVillage.builder()
                .id(1L)
                .name("Làng Đào Xá")
                .location("Ứng Hòa, Hà Nội")
                .description("Làng nghề làm đàn Đào Xá")
                .imageUrl("/images/dao-xa.jpg")
                .build();

        CraftVillage village2 = CraftVillage.builder()
                .id(2L)
                .name("Làng nghề Trúc Sơn")
                .location("Chương Mỹ, Hà Nội")
                .description("Làng nghề làm sáo trúc")
                .imageUrl("/images/truc-son.jpg")
                .build();

        when(craftVillageRepository.findAll()).thenReturn(List.of(village1, village2));

        List<CraftVillageSummaryResponse> result = craftVillageService.listCraftVillages();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Làng Đào Xá");
        assertThat(result.get(1).name()).isEqualTo("Làng nghề Trúc Sơn");
    }

    @Test
    void shouldReturnCraftVillageByIdWhenExists() {
        CraftVillage village = CraftVillage.builder()
                .id(1L)
                .name("Làng Đào Xá")
                .location("Ứng Hòa, Hà Nội")
                .description("Làng nghề làm đàn Đào Xá")
                .imageUrl("/images/dao-xa.jpg")
                .build();

        when(craftVillageRepository.findById(1L)).thenReturn(Optional.of(village));

        CraftVillageSummaryResponse result = craftVillageService.getCraftVillage(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Làng Đào Xá");
        assertThat(result.location()).isEqualTo("Ứng Hòa, Hà Nội");
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenIdDoesNotExist() {
        when(craftVillageRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> craftVillageService.getCraftVillage(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenIdIsNull() {
        assertThatThrownBy(() -> craftVillageService.getCraftVillage(null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    void shouldRejectDeleteCraftVillageWhenArtisansAssociated() {
        CraftVillage village = CraftVillage.builder().id(1L).name("Làng Đào Xá").build();
        when(craftVillageRepository.findById(1L)).thenReturn(Optional.of(village));
        when(artisanRepository.countByCraftVillageId(1L)).thenReturn(2L);

        assertThatThrownBy(() -> craftVillageService.deleteCraftVillage(1L))
                .isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class)
                .hasMessageContaining("2");
    }

    @Test
    void shouldRejectDeleteCraftVillageWhenProductsAssociated() {
        CraftVillage village = CraftVillage.builder().id(1L).name("Làng Đào Xá").build();
        when(craftVillageRepository.findById(1L)).thenReturn(Optional.of(village));
        when(artisanRepository.countByCraftVillageId(1L)).thenReturn(0L);
        when(productRepository.countByCraftVillageId(1L)).thenReturn(7L);

        assertThatThrownBy(() -> craftVillageService.deleteCraftVillage(1L))
                .isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class)
                .hasMessageContaining("7");
    }

    @Test
    void shouldDeleteCraftVillageWhenItHasNoAssociations() {
        CraftVillage village = CraftVillage.builder().id(1L).name("Làng chưa sử dụng").build();
        when(craftVillageRepository.findById(1L)).thenReturn(Optional.of(village));
        when(artisanRepository.countByCraftVillageId(1L)).thenReturn(0L);
        when(productRepository.countByCraftVillageId(1L)).thenReturn(0L);

        craftVillageService.deleteCraftVillage(1L);

        verify(craftVillageRepository).delete(village);
    }
}
