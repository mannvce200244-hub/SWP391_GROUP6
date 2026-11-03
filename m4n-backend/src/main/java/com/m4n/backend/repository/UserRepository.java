package com.m4n.backend.repository;

import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<User> findByGoogleSubject(String googleSubject);

    List<User> findByRole_NameAndPhoneOrderByIdAsc(RoleName role, String phone, org.springframework.data.domain.Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCaseWithLock(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithLock(@Param("id") Long id);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRoleName(RoleName name);

    /**
     * Locks all active accounts of a role with PESSIMISTIC_WRITE. Used before demoting or
     * disabling a SUPER_ADMIN so concurrent privileged transitions serialize on the same rows
     * and the "at least one active SUPER_ADMIN" invariant cannot race to zero (BR-AUTH-06).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.role.name = :roleName AND u.isActive = true ORDER BY u.id")
    List<User> findActiveByRoleNameWithLock(@Param("roleName") RoleName roleName);
}
