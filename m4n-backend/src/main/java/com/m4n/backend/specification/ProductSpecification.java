package com.m4n.backend.specification;

import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductPromotion;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.time.Instant;

public final class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> filterCatalog(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Sort sort
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

            // The database filters/sorts the same charged price that the service exposes.
            Expression<BigDecimal> chargedPrice = minPrice != null || maxPrice != null || sort.getOrderFor("price") != null
                    ? effectivePrice(root, query, cb) : root.get("price");
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(chargedPrice, minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(chargedPrice, maxPrice));
            }

            if (sort.getOrderFor("price") != null && query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                var orders = new ArrayList<jakarta.persistence.criteria.Order>();
                for (Sort.Order order : sort) {
                    Expression<?> value = order.getProperty().equals("price") ? chargedPrice : root.get(order.getProperty());
                    orders.add(order.isAscending() ? cb.asc(value) : cb.desc(value));
                }
                if (sort.getOrderFor("id") == null) orders.add(cb.asc(root.get("id")));
                query.orderBy(orders);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Expression<BigDecimal> effectivePrice(Root<Product> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        var strongestRate = query.subquery(BigDecimal.class);
        var promotion = strongestRate.from(ProductPromotion.class);
        Instant now = Instant.now();
        strongestRate.select(cb.max(promotion.<BigDecimal>get("discountRate"))).where(
                cb.equal(promotion.get("product").get("id"), root.get("id")), cb.isTrue(promotion.get("isActive")),
                cb.greaterThan(promotion.get("discountRate"), BigDecimal.ZERO),
                cb.or(cb.isNull(promotion.get("validFrom")), cb.lessThanOrEqualTo(promotion.get("validFrom"), now)),
                cb.or(cb.isNull(promotion.get("validUntil")), cb.greaterThan(promotion.get("validUntil"), now)));
        Expression<BigDecimal> rate = cb.coalesce(strongestRate, BigDecimal.ZERO);
        Expression<BigDecimal> original = root.get("price");
        Expression<BigDecimal> discounted = cb.function("round", BigDecimal.class,
                cb.prod(original, cb.diff(BigDecimal.ONE, rate)), cb.literal(0));
        return cb.<BigDecimal>selectCase().when(cb.greaterThan(rate, BigDecimal.ZERO),
                cb.function("least", BigDecimal.class, original, discounted)).otherwise(original);
    }

    public static Specification<Product> filterAdminProducts(
            String keyword,
            Long categoryId,
            Long artisanId,
            Long craftVillageId,
            Boolean isActive
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Optional active/inactive filter
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            // 2. Keyword matching name, code, or barcode
            if (keyword != null && !keyword.isBlank()) {
                String term = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), term);
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), term);
                Predicate barcodeMatch = cb.like(cb.lower(cb.coalesce(root.get("barcode"), "")), term);
                predicates.add(cb.or(nameMatch, codeMatch, barcodeMatch));
            }

            // 3. Category ID filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // 4. Artisan ID filter
            if (artisanId != null) {
                predicates.add(cb.equal(root.get("artisan").get("id"), artisanId));
            }

            // 5. Craft Village ID filter
            if (craftVillageId != null) {
                predicates.add(cb.equal(root.get("craftVillage").get("id"), craftVillageId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
