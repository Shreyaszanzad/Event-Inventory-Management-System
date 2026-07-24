package com.softpoly.eventinventory.auth.dto;

/** Returned after a successful login (OTP verify or admin login). */
public record AuthResponseDto(
        String token,
        Long userId,
        String name,
        String role
) {}
