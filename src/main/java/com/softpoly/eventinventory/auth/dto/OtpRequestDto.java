package com.softpoly.eventinventory.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpRequestDto(
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "\\d{10}", message = "Phone must be a 10-digit number")
        String phone
) {}
