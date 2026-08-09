package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.TooManyRequestsException;
import com.softpoly.eventinventory.security.RateLimiterService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import com.softpoly.eventinventory.common.time.AppTime;
import com.softpoly.eventinventory.notification.SmsSender;

/**
 * Generates and verifies one-time passwords. The OTP is hashed (BCrypt) before storage.
 *
 * <p>Abuse protections:
 * <ul>
 *   <li>per-phone and per-IP rate limits on requests (SMS-spam / flooding),</li>
 *   <li>a resend cooldown between requests,</li>
 *   <li>previous active OTPs are invalidated when a new one is issued,</li>
 *   <li>a per-OTP cap on failed verification attempts (brute-force of the 6-digit code),</li>
 *   <li>a per-IP cap on verification calls.</li>
 * </ul>
 *
 * <p>Delivery goes through {@link SmsSender}. With the mock sender nothing leaves the process and
 * the raw code comes back in the API response so the dev login flow works without a phone; with a
 * real provider the code is sent by SMS and never appears in the response.
 */
@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiterService rateLimiter;
    private final SmsSender smsSender;

    private final String defaultCountryCode;
    private final boolean mockEnabled;
    private final int expiryMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;
    private final int requestLimit;
    private final long requestWindowMs;

    public OtpService(OtpTokenRepository otpTokenRepository,
                      PasswordEncoder passwordEncoder,
                      RateLimiterService rateLimiter,
                      SmsSender smsSender,
                      @Value("${app.otp.default-country-code}") String defaultCountryCode,
                      @Value("${app.otp.mock-enabled}") boolean mockEnabled,
                      @Value("${app.otp.expiry-minutes}") int expiryMinutes,
                      @Value("${app.otp.max-attempts}") int maxAttempts,
                      @Value("${app.otp.resend-cooldown-seconds}") int resendCooldownSeconds,
                      @Value("${app.otp.request-limit-per-window}") int requestLimit,
                      @Value("${app.otp.request-window-minutes}") int requestWindowMinutes) {
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
        this.smsSender = smsSender;
        this.defaultCountryCode = defaultCountryCode;
        this.mockEnabled = mockEnabled;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.requestLimit = requestLimit;
        this.requestWindowMs = requestWindowMinutes * 60_000L;
    }

    /** Creates an OTP for the phone, stores its hash, and returns the raw code (only in mock mode). */
    @Transactional
    public String generateOtp(String phone, String clientIp) {
        // 1) Rate limit: cap requests per phone, and (more loosely) per IP.
        if (!rateLimiter.isAllowed("otp-req:phone:" + phone, requestLimit, requestWindowMs)
                || !rateLimiter.isAllowed("otp-req:ip:" + clientIp, requestLimit * 3, requestWindowMs)) {
            throw new TooManyRequestsException("Too many OTP requests. Please try again later.");
        }

        // 2) Resend cooldown: block a new request too soon after the previous one.
        otpTokenRepository.findTopByPhoneOrderByCreatedAtDesc(phone).ifPresent(last -> {
            if (last.getCreatedAt().plusSeconds(resendCooldownSeconds).isAfter(AppTime.now())) {
                throw new TooManyRequestsException(
                        "Please wait " + resendCooldownSeconds + " seconds before requesting another OTP.");
            }
        });

        // 3) Invalidate any still-active OTPs so only the newest code works.
        otpTokenRepository.invalidateActiveTokens(phone);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpToken token = OtpToken.builder()
                .phone(phone)
                .otpHash(passwordEncoder.encode(code))
                .expiresAt(AppTime.now().plusMinutes(expiryMinutes))
                .used(false)
                .attempts(0)
                .build();
        otpTokenRepository.save(token);

        // Deliver. A failure throws, which rolls the token back — better than leaving the caller
        // waiting for a code that was never sent.
        smsSender.send(toE164(phone), buildMessage(code));

        // The code is echoed back only when nothing was really sent. Keying this off the sender
        // rather than a standalone flag means a real provider cannot leak the OTP however the rest
        // of the configuration is set.
        return (smsSender.isMock() && mockEnabled) ? code : null;
    }

    /**
     * Validates the latest unused OTP for a phone; marks it used on success.
     * noRollbackFor keeps the failed-attempt increment committed even when we throw to reject the code.
     */
    @Transactional(noRollbackFor = {BadRequestException.class, TooManyRequestsException.class})
    public void verifyOtp(String phone, String otp, String clientIp) {
        // Cap verification volume per IP (defends against cycling many phone numbers).
        if (!rateLimiter.isAllowed("otp-verify:ip:" + clientIp, 20, 15 * 60_000L)) {
            throw new TooManyRequestsException("Too many verification attempts. Please try again later.");
        }

        OtpToken token = otpTokenRepository
                .findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new BadRequestException("No active OTP. Please request a new one."));

        if (token.getExpiresAt().isBefore(AppTime.now())) {
            throw new BadRequestException("OTP has expired, please request a new one");
        }

        // Brute-force guard: burn the OTP once too many wrong guesses are made.
        if (token.getAttempts() >= maxAttempts) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            throw new TooManyRequestsException("Too many incorrect attempts. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otp, token.getOtpHash())) {
            token.setAttempts(token.getAttempts() + 1);
            otpTokenRepository.save(token);
            throw new BadRequestException("Invalid OTP");
        }

        token.setUsed(true);
        otpTokenRepository.save(token);
    }

    /** The message body. Kept short — long messages bill as several segments. */
    private String buildMessage(String code) {
        return "Your EventPass verification code is " + code
                + ". It expires in " + expiryMinutes + " minutes. Do not share it with anyone.";
    }

    /**
     * Stored numbers are ten digits; providers want E.164. Anything already carrying a country
     * code is left as-is.
     */
    private String toE164(String phone) {
        if (phone.startsWith("+")) {
            return phone;
        }
        return defaultCountryCode + phone;
    }
}
