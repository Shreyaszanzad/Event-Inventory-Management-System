package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.auth.dto.*;
import com.softpoly.eventinventory.common.enums.Role;
import com.softpoly.eventinventory.common.enums.UserStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.TooManyRequestsException;
import com.softpoly.eventinventory.security.JwtService;
import com.softpoly.eventinventory.security.RateLimiterService;
import com.softpoly.eventinventory.user.User;
import com.softpoly.eventinventory.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiterService rateLimiter;

    private final int loginLimit;
    private final long loginWindowMs;

    public AuthService(UserRepository userRepository, OtpService otpService,
                       JwtService jwtService, PasswordEncoder passwordEncoder,
                       RateLimiterService rateLimiter,
                       @Value("${app.security.login-limit-per-window}") int loginLimit,
                       @Value("${app.security.login-window-minutes}") int loginWindowMinutes) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
        this.loginLimit = loginLimit;
        this.loginWindowMs = loginWindowMinutes * 60_000L;
    }

    /** Step 1 of user login: issue an OTP for the phone number. */
    public OtpRequestResponseDto requestOtp(OtpRequestDto dto, String clientIp) {
        String devOtp = otpService.generateOtp(dto.phone(), clientIp);
        return new OtpRequestResponseDto("OTP sent to " + dto.phone(), devOtp);
    }

    /** Step 2 of user login: verify OTP, create the user if new, and return a JWT. */
    @Transactional(noRollbackFor = {BadRequestException.class, TooManyRequestsException.class})
    public AuthResponseDto verifyOtp(OtpVerifyDto dto, String clientIp) {
        otpService.verifyOtp(dto.phone(), dto.otp(), clientIp);

        User user = userRepository.findByPhone(dto.phone())
                .orElseGet(() -> userRepository.save(User.builder()
                        .phone(dto.phone())
                        .role(Role.USER)
                        .status(UserStatus.ACTIVE)
                        .build()));

        // Phone + OTP is the CUSTOMER entrance. Minting a token here that carries the account's
        // stored role would turn knowledge of an administrator's phone number into full admin
        // access — the OTP flow never checks a password, so the only thing standing between an
        // attacker and ROLE_ADMIN would be the six-digit code. Administrators use email+password.
        //
        // Refused at verify rather than at request on purpose: with a real SMS provider the caller
        // never sees the code, so this cannot be used to probe which numbers are admin accounts.
        if (user.getRole() != Role.USER) {
            throw new BadRequestException(
                    "This number is registered to an administrator account. "
                            + "Please sign in with your email and password instead.");
        }

        // Deactivating an account has to actually stop it logging in.
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("This account has been deactivated.");
        }

        String token = jwtService.generateToken(user.getId(), user.getRole().name(),
                user.getName() != null ? user.getName() : user.getPhone());
        return new AuthResponseDto(token, user.getId(), user.getName(), user.getRole().name());
    }

    /** Admin login with email + password, throttled per email and per IP. */
    public AuthResponseDto adminLogin(AdminLoginDto dto, String clientIp) {
        if (!rateLimiter.isAllowed("admin-login:email:" + dto.email(), loginLimit, loginWindowMs)
                || !rateLimiter.isAllowed("admin-login:ip:" + clientIp, loginLimit * 2, loginWindowMs)) {
            throw new TooManyRequestsException("Too many login attempts. Please try again later.");
        }

        User admin = userRepository.findByEmailAndRole(dto.email(), Role.ADMIN)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (admin.getPasswordHash() == null
                || !passwordEncoder.matches(dto.password(), admin.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        // Same message as a wrong password: a deactivated administrator should not be able to
        // tell the difference, or the endpoint becomes an account-enumeration oracle.
        if (admin.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtService.generateToken(admin.getId(), admin.getRole().name(), admin.getName());
        return new AuthResponseDto(token, admin.getId(), admin.getName(), admin.getRole().name());
    }
}
