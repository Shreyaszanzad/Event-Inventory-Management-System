package com.softpoly.eventinventory.show;

import jakarta.persistence.*;
import lombok.*;

import com.softpoly.eventinventory.common.time.AppTime;

import java.time.LocalDateTime;

/** A scheduled showtime for a TICKETED event. A ticketed event can have many shows. */
@Entity
@Table(name = "shows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Show {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long eventId;

    @Column(nullable = false)
    private LocalDateTime showDatetime;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = AppTime.now();
        if (status == null) status = "ACTIVE";
    }
}
