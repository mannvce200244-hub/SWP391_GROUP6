package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.CreateArtisanRequest;
import com.m4n.backend.dto.request.UpdateArtisanRequest;
import com.m4n.backend.dto.response.ArtisanDetailResponse;
import com.m4n.backend.dto.response.ArtisanSummaryResponse;
import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.ResourceInUseException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.ArticleRepository;
import com.m4n.backend.service.ArtisanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ArtisanServiceImpl implements ArtisanService {

    private final ArtisanRepository artisanRepository;
    private final CraftVillageRepository craftVillageRepository;
    private final ProductRepository productRepository;
    private final ArticleRepository articleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ArtisanSummaryResponse> listArtisans() {
        return artisanRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(a -> new ArtisanSummaryResponse(a.getId(), a.getName(), a.getBiography(), a.getAvatarUrl()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ArtisanSummaryResponse> searchArtisans(String keyword, Pageable pageable) {
        if (pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        if (pageable.getSort().stream().anyMatch(order -> !Set.of("id", "name", "createdAt").contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp nghệ nhân không hợp lệ.");
        }
        Specification<Artisan> filters = (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) return builder.conjunction();
            String text = keyword.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
            String pattern = "%" + text + "%";
            return builder.or(builder.like(builder.lower(root.get("name")), pattern, '\\'),
                    builder.like(builder.lower(root.get("biography")), pattern, '\\'));
        };
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("id");
        if (sort.getOrderFor("id") == null) sort = sort.and(Sort.by("id"));
        return artisanRepository.findAll(filters, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort))
                .map(a -> new ArtisanSummaryResponse(a.getId(), a.getName(), a.getBiography(), a.getAvatarUrl()));
    }

    @Override
    @Transactional(readOnly = true)
    public ArtisanSummaryResponse getArtisan(Long id) {
        Artisan artisan = artisanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghệ nhân với id: " + id));
        return new ArtisanSummaryResponse(artisan.getId(), artisan.getName(), artisan.getBiography(), artisan.getAvatarUrl());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtisanDetailResponse> listAdminArtisans() {
        var productCounts = productRepository.countProductsGroupedByArtisanId().stream()
                .collect(java.util.stream.Collectors.toMap(row -> (Long) row[0], row -> ((Number) row[1]).longValue()));
        return artisanRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(artisan -> toDetailResponse(artisan, productCounts.getOrDefault(artisan.getId(), 0L)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ArtisanDetailResponse getAdminArtisanDetail(Long id) {
        Artisan artisan = artisanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghệ nhân với id: " + id));
        return toDetailResponse(artisan);
    }

    @Override
    @Transactional
    public ArtisanDetailResponse createArtisan(CreateArtisanRequest request) {
        String cleanName = request.name().trim();
        if (artisanRepository.existsByNameIgnoreCase(cleanName)) {
            throw new DuplicateResourceException("Tên nghệ nhân đã tồn tại: " + cleanName);
        }

        CraftVillage village = null;
        if (request.craftVillageId() != null) {
            village = craftVillageRepository.findById(request.craftVillageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với id: " + request.craftVillageId()));
        }

        Artisan artisan = Artisan.builder()
                .name(cleanName)
                .biography(request.biography() != null ? request.biography().trim() : null)
                .avatarUrl(request.avatarUrl() != null ? request.avatarUrl().trim() : null)
                .craftVillage(village)
                .build();

        Artisan saved = artisanRepository.save(artisan);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public ArtisanDetailResponse updateArtisan(Long id, UpdateArtisanRequest request) {
        Artisan artisan = artisanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghệ nhân với id: " + id));

        String cleanName = request.name().trim();
        if (artisanRepository.existsByNameIgnoreCaseAndIdNot(cleanName, id)) {
            throw new DuplicateResourceException("Tên nghệ nhân đã tồn tại: " + cleanName);
        }

        CraftVillage village = null;
        if (request.craftVillageId() != null) {
            village = craftVillageRepository.findById(request.craftVillageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy làng nghề với id: " + request.craftVillageId()));
        }

        artisan.setName(cleanName);
        artisan.setBiography(request.biography() != null ? request.biography().trim() : null);
        artisan.setAvatarUrl(request.avatarUrl() != null ? request.avatarUrl().trim() : null);
        artisan.setCraftVillage(village);

        Artisan updated = artisanRepository.save(artisan);
        return toDetailResponse(updated);
    }

    @Override
    @Transactional
    public void deleteArtisan(Long id) {
        Artisan artisan = artisanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghệ nhân với id: " + id));

        long count = productRepository.countByArtisanId(id);
        if (count > 0) {
            throw new ResourceInUseException("Không thể xóa nghệ nhân '" + artisan.getName() + "' vì đang có " + count + " sản phẩm liên kết");
        }

        if (articleRepository.existsByArtisanId(id)) {
            throw new ResourceInUseException("Không thể xóa nghệ nhân đang liên kết với bài viết hoặc hướng dẫn.");
        }

        artisanRepository.delete(artisan);
    }

    private ArtisanDetailResponse toDetailResponse(Artisan a) {
        return toDetailResponse(a, productRepository.countByArtisanId(a.getId()));
    }

    private ArtisanDetailResponse toDetailResponse(Artisan a, long productCount) {
        Long villageId = a.getCraftVillage() != null ? a.getCraftVillage().getId() : null;
        String villageName = a.getCraftVillage() != null ? a.getCraftVillage().getName() : null;
        return new ArtisanDetailResponse(
                a.getId(),
                a.getName(),
                a.getBiography(),
                a.getAvatarUrl(),
                villageId,
                villageName,
                productCount,
                a.getCreatedAt()
        );
    }
}
