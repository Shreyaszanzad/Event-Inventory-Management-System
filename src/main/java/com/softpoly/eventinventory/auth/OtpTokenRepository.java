package com.softpoly.eventinventory.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /** Most recent unused OTP for a phone number (used during verification). */
    Optional<OtpToken> findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(String phone);

    /** Most recent OTP of any state for a phone (used for the resend cooldown check). */
    Optional<OtpToken> findTopByPhoneOrderByCreatedAtDesc(String phone);

    /** Invalidate all still-active OTPs for a phone so only the newest code can be used. */
    @Modifying
    @Query("update OtpToken t set t.used = true where t.phone = :phone and t.used = false")
    int invalidateActiveTokens(@Param("phone") String phone);
}
