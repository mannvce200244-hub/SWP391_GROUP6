package com.m4n.backend.repository;

import com.m4n.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findAllByUserIdAndUsedAtIsNull(Long userId);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.usedAt = :usedAt WHERE p.user.id = :userId AND p.usedAt IS NULL")
    int invalidateAllByUserId(@Param("userId") Long userId, @Param("usedAt") Instant usedAt);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}
