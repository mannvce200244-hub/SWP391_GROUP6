package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateArtisanRequest;
import com.m4n.backend.dto.request.UpdateArtisanRequest;
import com.m4n.backend.dto.response.ArtisanDetailResponse;
import com.m4n.backend.dto.response.ArtisanSummaryResponse;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ArtisanService {
    List<ArtisanSummaryResponse> listArtisans();

    Page<ArtisanSummaryResponse> searchArtisans(String keyword, Pageable pageable);

    ArtisanSummaryResponse getArtisan(Long id);

    List<ArtisanDetailResponse> listAdminArtisans();

    ArtisanDetailResponse getAdminArtisanDetail(Long id);

    ArtisanDetailResponse createArtisan(CreateArtisanRequest request);

    ArtisanDetailResponse updateArtisan(Long id, UpdateArtisanRequest request);

    void deleteArtisan(Long id);
}
