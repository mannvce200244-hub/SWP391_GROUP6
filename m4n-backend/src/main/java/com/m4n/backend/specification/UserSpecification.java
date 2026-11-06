package com.m4n.backend.specification;

import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    private UserSpecification() {
        // Utility class
    }

    public static Specification<User> withFilters(String keyword, RoleName roleName, Boolean isActive) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate fullNamePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(fullNamePredicate, emailPredicate));
            }

            if (roleName != null) {
                Join<User, Role> roleJoin = root.join("role");
                predicates.add(cb.equal(roleJoin.get("name"), roleName));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
