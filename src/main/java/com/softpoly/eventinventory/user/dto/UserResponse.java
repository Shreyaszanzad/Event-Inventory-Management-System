package com.softpoly.eventinventory.user.dto;

import com.softpoly.eventinventory.user.User;

import java.time.LocalDateTime;

/**
 * The signed-in account, as it may be shown back to its owner.
 *
 * <p>{@code passwordHash} is deliberately absent — nothing outside authentication has any reason
 * to see it, and a DTO is the place to make that impossible rather than remembering not to.
 */
public record UserResponse(
        Long id,
        String name,
        String phone,
        String email,
        String role,
        String status,
        /** Account creation time — the profile page's "member since". */
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getCreatedAt());
    }
}
