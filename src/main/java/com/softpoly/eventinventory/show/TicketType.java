package com.softpoly.eventinventory.show;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** A priced ticket tier (e.g. Gold/Silver) for a show, with its own capacity. */
@Entity
@Table(name = "ticket_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long showId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer totalQty;

    /** Remaining tickets; decremented atomically at booking time. */
    @Column(nullable = false)
    private Integer availableQty;
}
