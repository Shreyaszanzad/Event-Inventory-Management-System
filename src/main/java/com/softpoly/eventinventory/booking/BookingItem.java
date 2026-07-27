package com.softpoly.eventinventory.booking;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** A line item within a booking: N tickets of a given tier, at the price captured when booked. */
@Entity
@Table(name = "booking_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false)
    private Long ticketTypeId;

    @Column(nullable = false)
    private Integer quantity;

    /** Price snapshot at booking time — independent of later ticket-type price changes. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
}
