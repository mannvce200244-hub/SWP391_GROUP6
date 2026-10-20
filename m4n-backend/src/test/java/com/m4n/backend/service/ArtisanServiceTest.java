package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateArtisanRequest;
import com.m4n.backend.dto.response.ArtisanDetailResponse;
import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.ResourceInUseException;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.serviceImpl.ArtisanServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArtisanServiceTest {

    @Mock
    private ArtisanRepository artisanRepository;

    @Mock
    private CraftVillageRepository craftVillageRepository;

    @Mock
    private ProductRepository productRepository;

    private ArtisanService artisanService;

    @BeforeEach
    void setUp() {
        artisanService = new ArtisanServiceImpl(artisanRepository, craftVillageRepository, productRepository);
    }

    @Test
    @DisplayName("Should list all admin artisans with product count")
    void shouldListAdminArtisans() {
        CraftVillage village = CraftVillage.builder().id(10L).name("Làng Đào Xá").build();
        Artisan artisan = Artisan.builder().id(1L).name("Nguyễn Văn A").craftVillage(village).build();

        when(artisanRepository.findAll(any(Sort.class))).thenReturn(List.of(artisan));
        when(productRepository.countByArtisanId(1L)).thenReturn(3L);

        List<ArtisanDetailResponse> result = artisanService.listAdminArtisans();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Nguyễn Văn A");
        assertThat(result.get(0).craftVillageName()).isEqualTo("Làng Đào Xá");
        assertThat(result.get(0).productCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("Should reject duplicate artisan name on create")
    void shouldRejectDuplicateArtisanName() {
        when(artisanRepository.existsByNameIgnoreCase("Nguyễn Văn A")).thenReturn(true);

        CreateArtisanRequest request = new CreateArtisanRequest("Nguyễn Văn A", "Tiểu sử", null, null);

        assertThatThrownBy(() -> artisanService.createArtisan(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Nguyễn Văn A");
    }

    @Test
    @DisplayName("Should reject delete artisan when products are associated")
    void shouldRejectDeleteArtisanWhenInUse() {
        Artisan artisan = Artisan.builder().id(1L).name("Nguyễn Văn A").build();
        when(artisanRepository.findById(1L)).thenReturn(Optional.of(artisan));
        when(productRepository.countByArtisanId(1L)).thenReturn(4L);

        assertThatThrownBy(() -> artisanService.deleteArtisan(1L))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessageContaining("4");
    }
}
