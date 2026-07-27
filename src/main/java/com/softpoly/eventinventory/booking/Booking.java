package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.common.enums.BookingStatus;
import com.softpoly.eventinventory.common.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A user's booking for a show, made up of one or more ticket-tier line items. */
@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Public, unique, non-sequential booking code shown to the customer (e.g. EVB-7K9QX2M4). */
    @Column(nullable = false, unique = true, length = 20)
    private String bookingReference;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long showId;

    @Column(nullable = false)
    private LocalDateTime bookingDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingItem> items = new ArrayList<>();

    public void addItem(BookingItem item) {
        item.setBooking(this);
        items.add(item);
    }

    @PrePersist
    void onCreate() {
        if (bookingDate == null) bookingDate = LocalDateTime.now();
        if (paymentStatus == null) paymentStatus = PaymentStatus.PENDING;
        if (status == null) status = BookingStatus.CONFIRMED;
    }
}
