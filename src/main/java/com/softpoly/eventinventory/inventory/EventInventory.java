package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.enums.AllocationStatus;
import com.softpoly.eventinventory.common.time.AppTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One inventory item assigned to one event, in some quantity.
 *
 * <p>An event gets at most one row per item — the unique constraint below — so raising the
 * quantity is an update rather than a second allocation. That keeps "how many chairs does this
 * event have?" a single lookup instead of a sum, and makes the release-on-delete arithmetic
 * unambiguous.
 */
@Entity
@Table(name = "event_inventory",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_event_inventory_item",
                columnNames = {"event_id", "inventory_item_id"}),
        indexes = {
                @Index(name = "idx_event_inventory_event", columnList = "event_id"),
                @Index(name = "idx_event_inventory_item", columnList = "inventory_item_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "inventory_item_id", nullable = false)
    private Long inventoryItemId;

    @Column(nullable = false)
    private Integer allocatedQty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AllocationStatus status;

    /** Free-text note — where the kit is going, who signed for it. */
    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime allocatedAt;

    /** Set when the allocation moves to RETURNED or CANCELLED. */
    private LocalDateTime releasedAt;

    @PrePersist
    void onCreate() {
        if (allocatedAt == null) allocatedAt = AppTime.now();
        if (status == null) status = AllocationStatus.ALLOCATED;
    }

    /** Only ALLOCATED rows are actually holding stock. */
    public boolean isHoldingStock() {
        return status == AllocationStatus.ALLOCATED;
    }
}
