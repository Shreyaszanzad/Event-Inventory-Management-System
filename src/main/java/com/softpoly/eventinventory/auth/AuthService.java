package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.auth.dto.*;
import com.softpoly.eventinventory.common.enums.Role;
import com.softpoly.eventinventory.common.enums.UserStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.security.JwtService;
import com.softpoly.eventinventory.user.User;
import com.softpoly.eventinventory.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, OtpService otpService,
                       JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    /** Step 1 of user login: issue an OTP for the phone number. */
    public OtpRequestResponseDto requestOtp(OtpRequestDto dto) {
        String devOtp = otpService.generateOtp(dto.phone());
        return new OtpRequestResponseDto("OTP sent to " + dto.phone(), devOtp);
    }

    /** Step 2 of user login: verify OTP, create the user if new, and return a JWT. */
    @Transactional
    public AuthResponseDto verifyOtp(OtpVerifyDto dto) {
        otpService.verifyOtp(dto.phone(), dto.otp());

        User user = userRepository.findByPhone(dto.phone())
                .orElseGet(() -> userRepository.save(User.builder()
                        .phone(dto.phone())
                        .role(Role.USER)
                        .status(UserStatus.ACTIVE)
                        .build()));

        String token = jwtService.generateToken(user.getId(), user.getRole().name(),
                user.getName() != null ? user.getName() : user.getPhone());
        return new AuthResponseDto(token, user.getId(), user.getName(), user.getRole().name());
    }

    /** Admin login with email + password. */
    public AuthResponseDto adminLogin(AdminLoginDto dto) {
        User admin = userRepository.findByEmailAndRole(dto.email(), Role.ADMIN)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (admin.getPasswordHash() == null
                || !passwordEncoder.matches(dto.password(), admin.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtService.generateToken(admin.getId(), admin.getRole().name(), admin.getName());
        return new AuthResponseDto(token, admin.getId(), admin.getName(), admin.getRole().name());
    }
}
