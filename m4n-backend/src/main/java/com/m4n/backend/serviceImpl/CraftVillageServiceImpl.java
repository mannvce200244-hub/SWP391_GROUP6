package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.response.CraftVillageSummaryResponse;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.service.CraftVillageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CraftVillageServiceImpl implements CraftVillageService {

    private final CraftVillageRepository craftVillageRepository;
    private final ProductMapper productMapper;

    public CraftVillageServiceImpl(
            CraftVillageRepository craftVillageRepository,
            ProductMapper productMapper
    ) {
        this.craftVillageRepository = craftVillageRepository;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CraftVillageSummaryResponse> listCraftVillages() {
        return craftVillageRepository.findAll().stream()
                .map(productMapper::toCraftVillageSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CraftVillageSummaryResponse getCraftVillage(Long id) {
        if (id == null) {
            throw new ResourceNotFoundException("ID làng nghề không hợp lệ");
        }
        return craftVillageRepository.findById(id)
                .map(productMapper::toCraftVillageSummary)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với ID: " + id));
    }
}
