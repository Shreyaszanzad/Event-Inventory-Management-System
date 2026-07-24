package com.softpoly.eventinventory.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** A single issued OTP for a phone number. The code itself is stored hashed, never in clear text. */
@Entity
@Table(name = "otp_tokens", indexes = @Index(name = "idx_otp_phone", columnList = "phone"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(nullable = false)
    private String otpHash;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
