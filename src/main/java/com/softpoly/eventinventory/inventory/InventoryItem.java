package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.common.enums.InventoryStatus;
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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A physical asset the company owns and lends to events — chairs, speakers, drapes.
 *
 * <p>Stock works exactly like {@code TicketType}: {@code totalQty} is what we own and
 * {@code availableQty} is what is not currently out on an event. Allocations move quantity
 * between the two, and the same guarded-update trick in
 * {@link InventoryItemRepository#allocateStock} keeps two admins from over-allocating the
 * same crate of speakers.
 */
@Entity
@Table(name = "inventory_items", indexes = {
        @Index(name = "idx_inventory_category", columnList = "category"),
        @Index(name = "idx_inventory_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InventoryCategory category;

    /** Everything we own, whether or not it is currently out. */
    @Column(nullable = false)
    private Integer totalQty;

    /** What is free to allocate right now. Never below zero, never above {@link #totalQty}. */
    @Column(nullable = false)
    private Integer availableQty;

    /** Replacement/rental value per unit — used to price an event's kit. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InventoryStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Long version;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = AppTime.now();
        if (status == null) status = InventoryStatus.ACTIVE;
    }

    /** How many units are currently out on events. */
    public int allocatedQty() {
        return totalQty - availableQty;
    }
}
