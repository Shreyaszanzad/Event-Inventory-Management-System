package com.softpoly.eventinventory.billing;

import com.softpoly.eventinventory.common.enums.InvoiceStatus;
import com.softpoly.eventinventory.common.time.AppTime;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A billing document for a booking: subtotal − discount = total, tracked against payments. */
@Entity
@Table(name = "invoices",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_invoices_number", columnNames = "invoiceNumber"),
                @UniqueConstraint(name = "uk_invoices_booking", columnNames = "bookingId")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String invoiceNumber;

    /** One invoice per booking. */
    @Column(nullable = false)
    private Long bookingId;

    /** The booking's owner — used for user-side ownership checks. */
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal paidAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status;

    @Column(nullable = false)
    private LocalDateTime invoiceDate;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    @Version
    private Long version;

    public void addPayment(Payment payment) {
        payment.setInvoice(this);
        payments.add(payment);
    }

    @PrePersist
    void onCreate() {
        if (invoiceDate == null) invoiceDate = AppTime.now();
    }
}
