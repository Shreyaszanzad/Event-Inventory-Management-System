package com.softpoly.eventinventory.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyDto(
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "\\d{10}", message = "Phone must be a 10-digit number")
        String phone,

        @NotBlank(message = "OTP is required")
        @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits")
        String otp
) {

    /**
     * Runs before bean validation. Pasted numbers arrive with spaces, dashes or a +91 prefix;
     * reducing to the last ten digits lets the pattern judge the number, not its formatting.
     */
    public OtpVerifyDto {
        if (phone != null) {
            String digits = phone.replaceAll("\\D", "");
            phone = digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
        }
        if (otp != null) {
            otp = otp.trim();
        }
    }
}
