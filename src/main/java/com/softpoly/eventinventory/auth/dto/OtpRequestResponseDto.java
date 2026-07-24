package com.softpoly.eventinventory.auth.dto;

/**
 * Response to an OTP request. While OTP is mocked, {@code devOtp} carries the generated code
 * so the team can test without a real SMS gateway. It is null once mock mode is turned off.
 */
public record OtpRequestResponseDto(
        String message,
        String devOtp
) {}
