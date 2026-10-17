package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.CreateCraftVillageRequest;
import com.m4n.backend.dto.request.UpdateCraftVillageRequest;
import com.m4n.backend.dto.response.CraftVillageDetailResponse;
import com.m4n.backend.dto.response.CraftVillageSummaryResponse;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.ResourceInUseException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.ProductMapper;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.CraftVillageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CraftVillageServiceImpl implements CraftVillageService {

    private final CraftVillageRepository craftVillageRepository;
    private final ProductMapper productMapper;
    private final ArtisanRepository artisanRepository;
    private final ProductRepository productRepository;

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

    @Override
    @Transactional(readOnly = true)
    public List<CraftVillageDetailResponse> listAdminCraftVillages() {
        return craftVillageRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(this::toDetailResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CraftVillageDetailResponse getAdminCraftVillageDetail(Long id) {
        CraftVillage village = craftVillageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với ID: " + id));
        return toDetailResponse(village);
    }

    @Override
    @Transactional
    public CraftVillageDetailResponse createCraftVillage(CreateCraftVillageRequest request) {
        String cleanName = request.name().trim();
        if (craftVillageRepository.existsByNameIgnoreCase(cleanName)) {
            throw new DuplicateResourceException("Tên làng nghề đã tồn tại: " + cleanName);
        }

        CraftVillage village = CraftVillage.builder()
                .name(cleanName)
                .location(request.location().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .imageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null)
                .build();

        CraftVillage saved = craftVillageRepository.save(village);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public CraftVillageDetailResponse updateCraftVillage(Long id, UpdateCraftVillageRequest request) {
        CraftVillage village = craftVillageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với ID: " + id));

        String cleanName = request.name().trim();
        if (craftVillageRepository.existsByNameIgnoreCaseAndIdNot(cleanName, id)) {
            throw new DuplicateResourceException("Tên làng nghề đã tồn tại: " + cleanName);
        }

        village.setName(cleanName);
        village.setLocation(request.location().trim());
        village.setDescription(request.description() != null ? request.description().trim() : null);
        village.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null);

        CraftVillage updated = craftVillageRepository.save(village);
        return toDetailResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCraftVillage(Long id) {
        CraftVillage village = craftVillageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với ID: " + id));

        long artisanCount = artisanRepository.countByCraftVillageId(id);
        if (artisanCount > 0) {
            throw new ResourceInUseException("Không thể xóa làng nghề '" + village.getName() + "' vì đang có " + artisanCount + " nghệ nhân liên kết");
        }

        long productCount = productRepository.countByCraftVillageId(id);
        if (productCount > 0) {
            throw new ResourceInUseException("Không thể xóa làng nghề '" + village.getName() + "' vì đang có " + productCount + " sản phẩm liên kết");
        }

        craftVillageRepository.delete(village);
    }

    private CraftVillageDetailResponse toDetailResponse(CraftVillage v) {
        long artisanCount = artisanRepository.countByCraftVillageId(v.getId());
        long productCount = productRepository.countByCraftVillageId(v.getId());
        return new CraftVillageDetailResponse(
                v.getId(),
                v.getName(),
                v.getLocation(),
                v.getDescription(),
                v.getImageUrl(),
                artisanCount,
                productCount,
                v.getCreatedAt()
        );
    }
}

