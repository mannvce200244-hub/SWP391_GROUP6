package com.m4n.backend.service.serviceImpl;

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
import com.m4n.backend.repository.ArticleRepository;
import com.m4n.backend.service.CraftVillageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CraftVillageServiceImpl implements CraftVillageService {

    private final CraftVillageRepository craftVillageRepository;
    private final ProductMapper productMapper;
    private final ArtisanRepository artisanRepository;
    private final ProductRepository productRepository;
    private final ArticleRepository articleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CraftVillageSummaryResponse> listCraftVillages() {
        return craftVillageRepository.findAll().stream()
                .map(productMapper::toCraftVillageSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CraftVillageSummaryResponse> searchCraftVillages(String keyword, String location, Pageable pageable) {
        if (pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        if (pageable.getSort().stream().anyMatch(order -> !Set.of("id", "name", "createdAt").contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp làng nghề không hợp lệ.");
        }
        Specification<CraftVillage> filters = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.isBlank()) {
                String text = keyword.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
                String pattern = "%" + text + "%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("name")), pattern, '\\'),
                        builder.like(builder.lower(root.get("description")), pattern, '\\'),
                        builder.like(builder.lower(root.get("location")), pattern, '\\')));
            }
            if (location != null && !location.isBlank()) predicates.add(builder.equal(root.get("location"), location.trim()));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("id");
        if (sort.getOrderFor("id") == null) sort = sort.and(Sort.by("id"));
        return craftVillageRepository.findAll(filters, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort))
                .map(productMapper::toCraftVillageSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listLocations() {
        return craftVillageRepository.findDistinctLocations();
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
        var productCounts = productRepository.countProductsGroupedByCraftVillageId().stream()
                .collect(java.util.stream.Collectors.toMap(row -> (Long) row[0], row -> ((Number) row[1]).longValue()));
        var artisanCounts = artisanRepository.countArtisansGroupedByCraftVillageId().stream()
                .collect(java.util.stream.Collectors.toMap(row -> (Long) row[0], row -> ((Number) row[1]).longValue()));
        return craftVillageRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(village -> toDetailResponse(village, artisanCounts.getOrDefault(village.getId(), 0L), productCounts.getOrDefault(village.getId(), 0L)))
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

        if (articleRepository.existsByCraftVillageId(id)) {
            throw new ResourceInUseException("Không thể xóa làng nghề đang liên kết với bài viết hoặc hướng dẫn.");
        }

        craftVillageRepository.delete(village);
    }

    private CraftVillageDetailResponse toDetailResponse(CraftVillage v) {
        return toDetailResponse(v, artisanRepository.countByCraftVillageId(v.getId()), productRepository.countByCraftVillageId(v.getId()));
    }

    private CraftVillageDetailResponse toDetailResponse(CraftVillage v, long artisanCount, long productCount) {
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

