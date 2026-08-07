package com.softpoly.eventinventory.inventory.dto;

import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.inventory.InventoryItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InventoryItemResponse(
        Long id,
        String name,
        String description,
        InventoryCategory category,
        Integer totalQty,
        Integer availableQty,
        /** Derived, so the admin UI does not have to subtract. */
        Integer allocatedQty,
        BigDecimal unitPrice,
        String status,
        LocalDateTime createdAt
) {
    public static InventoryItemResponse from(InventoryItem item) {
        return new InventoryItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getCategory(),
                item.getTotalQty(),
                item.getAvailableQty(),
                item.allocatedQty(),
                item.getUnitPrice(),
                item.getStatus().name(),
                item.getCreatedAt());
    }
}
