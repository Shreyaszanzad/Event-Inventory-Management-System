package com.softpoly.eventinventory.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminLoginDto(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {
    /**
     * Runs before bean validation, so a pasted " admin@eims.com " is judged on the address
     * rather than the whitespace that came with it.
     *
     * <p>Case is left alone deliberately: lower-casing here would change which stored account a
     * login matches, which is a bigger change than the whitespace bug this fixes.
     */
    public AdminLoginDto {
        if (email != null) {
            email = email.trim();
        }
        // password is not trimmed — spaces can be meaningful in one.
    }
}
