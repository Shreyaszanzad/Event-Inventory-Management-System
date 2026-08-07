package com.softpoly.eventinventory.inventory.dto;

import com.softpoly.eventinventory.inventory.EventInventory;
import com.softpoly.eventinventory.inventory.InventoryItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * An allocation, carrying enough of the item with it that the admin UI can render a row
 * without a second lookup — the same lesson as enriching BookingResponse.
 */
public record EventInventoryResponse(
        Long id,
        Long eventId,
        Long inventoryItemId,
        String itemName,
        String itemCategory,
        Integer allocatedQty,
        BigDecimal unitPrice,
        /** allocatedQty × unitPrice — what this line is worth. */
        BigDecimal lineValue,
        String status,
        String notes,
        LocalDateTime allocatedAt,
        LocalDateTime releasedAt
) {
    public static EventInventoryResponse from(EventInventory allocation, InventoryItem item) {
        BigDecimal unitPrice = item == null ? null : item.getUnitPrice();
        BigDecimal lineValue = unitPrice == null
                ? null
                : unitPrice.multiply(BigDecimal.valueOf(allocation.getAllocatedQty()));

        return new EventInventoryResponse(
                allocation.getId(),
                allocation.getEventId(),
                allocation.getInventoryItemId(),
                item == null ? null : item.getName(),
                item == null || item.getCategory() == null ? null : item.getCategory().name(),
                allocation.getAllocatedQty(),
                unitPrice,
                lineValue,
                allocation.getStatus().name(),
                allocation.getNotes(),
                allocation.getAllocatedAt(),
                allocation.getReleasedAt());
    }
}
