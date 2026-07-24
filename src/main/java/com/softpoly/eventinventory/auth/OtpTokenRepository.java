package com.softpoly.eventinventory.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /** Most recent unused OTP for a phone number. */
    Optional<OtpToken> findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(String phone);
}
