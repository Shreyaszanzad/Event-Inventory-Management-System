package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.auth.dto.*;
import com.softpoly.eventinventory.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** User login step 1 — request an OTP for a phone number. */
    @PostMapping("/otp/request")
    public ApiResponse<OtpRequestResponseDto> requestOtp(@Valid @RequestBody OtpRequestDto dto) {
        return ApiResponse.ok(authService.requestOtp(dto));
    }

    /** User login step 2 — verify the OTP and receive a JWT. */
    @PostMapping("/otp/verify")
    public ApiResponse<AuthResponseDto> verifyOtp(@Valid @RequestBody OtpVerifyDto dto) {
        return ApiResponse.ok("Login successful", authService.verifyOtp(dto));
    }

    /** Admin login — email + password. */
    @PostMapping("/admin/login")
    public ApiResponse<AuthResponseDto> adminLogin(@Valid @RequestBody AdminLoginDto dto) {
        return ApiResponse.ok("Login successful", authService.adminLogin(dto));
    }
}
