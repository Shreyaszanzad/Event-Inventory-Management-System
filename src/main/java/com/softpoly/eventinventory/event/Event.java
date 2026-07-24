package com.softpoly.eventinventory.event;

import com.softpoly.eventinventory.common.enums.EventCategory;
import com.softpoly.eventinventory.common.enums.EventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Reference entity for the catalog. Tanmay extends this domain with Show, TicketType, etc.
 * TICKETED events are public; INVENTORY events are admin-only (see EventService filtering).
 */
@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventType type;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EventCategory category;

    private String venueName;

    private String city;

    private String posterUrl;

    private LocalDateTime startTime;

    @Column(nullable = false, length = 20)
    private String status;

    private Long createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
