package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateCraftVillageRequest;
import com.m4n.backend.dto.request.UpdateCraftVillageRequest;
import com.m4n.backend.dto.response.CraftVillageDetailResponse;
import com.m4n.backend.dto.response.CraftVillageSummaryResponse;

import java.util.List;

public interface CraftVillageService {

    List<CraftVillageSummaryResponse> listCraftVillages();

    CraftVillageSummaryResponse getCraftVillage(Long id);

    List<CraftVillageDetailResponse> listAdminCraftVillages();

    CraftVillageDetailResponse getAdminCraftVillageDetail(Long id);

    CraftVillageDetailResponse createCraftVillage(CreateCraftVillageRequest request);

    CraftVillageDetailResponse updateCraftVillage(Long id, UpdateCraftVillageRequest request);

    void deleteCraftVillage(Long id);
}

