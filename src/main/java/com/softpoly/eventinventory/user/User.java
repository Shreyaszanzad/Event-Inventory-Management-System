package com.softpoly.eventinventory.user;

import com.softpoly.eventinventory.common.enums.Role;
import com.softpoly.eventinventory.common.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import com.softpoly.eventinventory.common.time.AppTime;

import java.time.LocalDateTime;

/**
 * Single account table for both realms:
 *  - general users authenticate by phone + OTP (email/password null),
 *  - admins authenticate by email + password (phone null).
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_phone", columnNames = "phone"),
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(length = 15)
    private String phone;

    private String email;

    /** BCrypt hash for admins; null for OTP users. */
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = AppTime.now();
        if (status == null) status = UserStatus.ACTIVE;
    }
}
