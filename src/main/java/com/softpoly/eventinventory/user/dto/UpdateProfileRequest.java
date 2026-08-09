package com.softpoly.eventinventory.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Self-service profile edit. Both fields are optional — send only what changes.
 *
 * <p>Phone, role and status are absent on purpose: phone is the OTP credential, and role/status
 * decide what the account may do. Neither belongs in a payload the account itself controls.
 */
public record UpdateProfileRequest(

        @Size(max = 255, message = "Name must be at most 255 characters")
        String name,

        @Email(message = "Email must be valid")
        @Size(max = 255, message = "Email must be at most 255 characters")
        String email
) {}
