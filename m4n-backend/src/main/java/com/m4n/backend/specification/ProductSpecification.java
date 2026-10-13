package com.m4n.backend.specification;

import com.m4n.backend.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> filterCatalog(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Only customer-visible active products
            predicates.add(cb.isTrue(root.get("isActive")));

            // 2. Keyword matching name, code, or barcode
            if (keyword != null && !keyword.isBlank()) {
                String term = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), term);
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), term);
                predicates.add(cb.or(nameMatch, codeMatch));
            }

            // 3. Category / Group matching category code (e.g. DAY, HOI, GO) or name
            if (group != null && !group.isBlank()) {
                String groupTerm = group.trim();
                Predicate catCodeMatch = cb.equal(cb.upper(root.get("category").get("code")), groupTerm.toUpperCase());
                Predicate catNameMatch = cb.like(cb.lower(root.get("category").get("name")), "%" + groupTerm.toLowerCase() + "%");
                predicates.add(cb.or(catCodeMatch, catNameMatch));
            }

            // 4. Artisan matching artisan name (or ID if numeric)
            if (artisan != null && !artisan.isBlank()) {
                String artisanTerm = artisan.trim();
                try {
                    Long artisanId = Long.parseLong(artisanTerm);
                    predicates.add(cb.equal(root.get("artisan").get("id"), artisanId));
                } catch (NumberFormatException ignored) {
                    predicates.add(cb.like(cb.lower(root.get("artisan").get("name")), "%" + artisanTerm.toLowerCase() + "%"));
                }
            }

            // 5. Craft village matching craft village name (or ID if numeric)
            if (craftVillage != null && !craftVillage.isBlank()) {
                String villageTerm = craftVillage.trim();
                try {
                    Long villageId = Long.parseLong(villageTerm);
                    predicates.add(cb.equal(root.get("craftVillage").get("id"), villageId));
                } catch (NumberFormatException ignored) {
                    predicates.add(cb.like(cb.lower(root.get("craftVillage").get("name")), "%" + villageTerm.toLowerCase() + "%"));
                }
            }

            // 6. Price filters
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
