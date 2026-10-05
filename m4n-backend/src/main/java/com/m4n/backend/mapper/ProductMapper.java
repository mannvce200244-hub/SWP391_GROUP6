package com.m4n.backend.mapper;

import com.m4n.backend.dto.response.ArtisanSummaryResponse;
import com.m4n.backend.dto.response.CategorySummaryResponse;
import com.m4n.backend.dto.response.CraftVillageSummaryResponse;
import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductMediaResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Component
public class ProductMapper {

    private final Locale vietnameseLocale = Locale.of("vi", "VN");

    public String formatPriceDisplay(BigDecimal price) {
        if (price == null) {
            return "0 ₫";
        }
        NumberFormat formatter = NumberFormat.getInstance(vietnameseLocale);
        return formatter.format(price) + " ₫";
    }

    public CategorySummaryResponse toCategorySummary(Category category) {
        if (category == null) {
            return null;
        }
        return new CategorySummaryResponse(
                category.getId(),
                category.getCode(),
                category.getName()
        );
    }

    public CraftVillageSummaryResponse toCraftVillageSummary(CraftVillage craftVillage) {
        if (craftVillage == null) {
            return null;
        }
        return new CraftVillageSummaryResponse(
                craftVillage.getId(),
                craftVillage.getName(),
                craftVillage.getLocation(),
                craftVillage.getDescription(),
                craftVillage.getImageUrl()
        );
    }

    public ArtisanSummaryResponse toArtisanSummary(Artisan artisan) {
        if (artisan == null) {
            return null;
        }
        return new ArtisanSummaryResponse(
                artisan.getId(),
                artisan.getName(),
                artisan.getBiography(),
                artisan.getAvatarUrl()
        );
    }

    public ProductMediaResponse toProductMediaResponse(ProductMedia media) {
        if (media == null) {
            return null;
        }
        return new ProductMediaResponse(
                media.getId(),
                media.getMediaType() != null ? media.getMediaType().name() : "IMAGE",
                media.getUrl(),
                media.getAltText(),
                media.getSortOrder()
        );
    }

    public List<ProductMediaResponse> toProductMediaResponses(List<ProductMedia> mediaList) {
        if (mediaList == null || mediaList.isEmpty()) {
            return Collections.emptyList();
        }
        return mediaList.stream()
                .sorted(Comparator.comparing(
                        ProductMedia::getSortOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(this::toProductMediaResponse)
                .toList();
    }

    public List<ProductMediaResponse> toPrimaryMediaResponses(List<ProductMedia> mediaList) {
        if (mediaList == null || mediaList.isEmpty()) {
            return Collections.emptyList();
        }
        return mediaList.stream()
                .sorted(Comparator.comparing(
                        ProductMedia::getSortOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .findFirst()
                .map(this::toProductMediaResponse)
                .map(List::of)
                .orElse(Collections.emptyList());
    }

    public ProductDetailResponse toDetailResponse(Product product, String availability, Integer stockQuantity) {
        if (product == null) {
            return null;
        }

        return new ProductDetailResponse(
                product.getId(),
                product.getCode(),
                product.getName(),
                product.getPrice(),
                formatPriceDisplay(product.getPrice()),
                product.getDescription(),
                toCategorySummary(product.getCategory()),
                product.getMaterial(),
                product.getDimensions(),
                product.getMusicalRange(),
                product.getOrigin(),
                toArtisanSummary(product.getArtisan()),
                toCraftVillageSummary(product.getCraftVillage()),
                toProductMediaResponses(product.getMedia()),
                availability,
                stockQuantity
        );
    }

    public ProductDetailResponse toDetailResponse(Product product, String availability) {
        return toDetailResponse(product, availability, null);
    }

    public ProductSummaryResponse toSummaryResponse(Product product, String availability) {
        if (product == null) {
            return null;
        }

        String groupName = product.getCategory() != null ? product.getCategory().getName() : null;
        String artisanName = product.getArtisan() != null ? product.getArtisan().getName() : null;
        String craftVillageName = product.getCraftVillage() != null ? product.getCraftVillage().getName() : null;

        return new ProductSummaryResponse(
                product.getId(),
                product.getCode(),
                product.getName(),
                product.getPrice(),
                formatPriceDisplay(product.getPrice()),
                groupName,
                artisanName,
                craftVillageName,
                toPrimaryMediaResponses(product.getMedia()),
                availability
        );
    }
}
