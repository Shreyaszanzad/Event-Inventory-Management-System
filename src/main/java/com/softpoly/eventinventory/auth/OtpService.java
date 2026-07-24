package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.common.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Generates and verifies one-time passwords. The OTP is hashed (BCrypt) before storage.
 * While {@code app.otp.mock-enabled=true}, no SMS is sent and the raw code is returned to the
 * caller for testing. Swap this class's send step for a real SMS gateway later — the API is unchanged.
 */
@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean mockEnabled;
    private final int expiryMinutes;

    public OtpService(OtpTokenRepository otpTokenRepository,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.otp.mock-enabled}") boolean mockEnabled,
                      @Value("${app.otp.expiry-minutes}") int expiryMinutes) {
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mockEnabled = mockEnabled;
        this.expiryMinutes = expiryMinutes;
    }

    /** Creates an OTP for the phone, stores its hash, and returns the raw code (only in mock mode). */
    @Transactional
    public String generateOtp(String phone) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        OtpToken token = OtpToken.builder()
                .phone(phone)
                .otpHash(passwordEncoder.encode(code))
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .used(false)
                .build();
        otpTokenRepository.save(token);

        // TODO: replace with real SMS gateway (MSG91 / Twilio) when mock mode is disabled.
        return mockEnabled ? code : null;
    }

    /** Validates the latest unused OTP for a phone; marks it used on success. */
    @Transactional
    public void verifyOtp(String phone, String otp) {
        OtpToken token = otpTokenRepository
                .findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new BadRequestException("No OTP requested for this number"));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired, please request a new one");
        }
        if (!passwordEncoder.matches(otp, token.getOtpHash())) {
            throw new BadRequestException("Invalid OTP");
        }

        token.setUsed(true);
        otpTokenRepository.save(token);
    }
}
