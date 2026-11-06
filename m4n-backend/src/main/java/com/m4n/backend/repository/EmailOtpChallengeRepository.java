package com.m4n.backend.repository;

import com.m4n.backend.entity.EmailOtpChallenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface EmailOtpChallengeRepository extends JpaRepository<EmailOtpChallenge, String> {
    // PostgreSQL upsert serializes the first request too; find-then-insert cannot lock a missing row.
    @Modifying
    @Query(value = "INSERT INTO email_otp_challenges (id,email,purpose,sends,attempts,consumed) "
            + "VALUES (:id,:email,:purpose,0,0,false) ON CONFLICT (id) DO NOTHING", nativeQuery = true)
    void ensureExists(@Param("id") String id, @Param("email") String email, @Param("purpose") String purpose);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from EmailOtpChallenge c where c.id = :id")
    Optional<EmailOtpChallenge> findLocked(@Param("id") String id);
}
