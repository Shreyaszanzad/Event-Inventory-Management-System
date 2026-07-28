package com.softpoly.eventinventory.billing;

import com.softpoly.eventinventory.common.enums.PaymentMode;
import com.softpoly.eventinventory.common.time.AppTime;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A single payment recorded against an invoice (supports partial payments). */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMode mode;

    @Column(nullable = false)
    private LocalDateTime paymentDate;

    @PrePersist
    void onCreate() {
        if (paymentDate == null) paymentDate = AppTime.now();
    }
}
