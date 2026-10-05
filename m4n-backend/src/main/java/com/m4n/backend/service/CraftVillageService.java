package com.m4n.backend.service;

import com.m4n.backend.dto.response.CraftVillageSummaryResponse;

import java.util.List;

public interface CraftVillageService {

    List<CraftVillageSummaryResponse> listCraftVillages();

    CraftVillageSummaryResponse getCraftVillage(Long id);
}
