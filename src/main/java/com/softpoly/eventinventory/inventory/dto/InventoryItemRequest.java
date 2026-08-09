package com.softpoly.eventinventory.inventory.dto;

import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.common.enums.InventoryStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Create/update payload for an inventory item.
 *
 * <p>{@code availableQty} is deliberately absent — it is derived from {@code totalQty} minus
 * whatever is currently allocated, and a client must never be able to set it directly.
 */
public record InventoryItemRequest(

        @NotBlank(message = "Item name is required")
        @Size(max = 255, message = "Item name must be at most 255 characters")
        String name,

        String description,

        @NotNull(message = "Category is required")
        InventoryCategory category,

        @NotNull(message = "Total quantity is required")
        @Min(value = 1, message = "Total quantity must be at least 1")
        Integer totalQty,

        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0.0", message = "Unit price cannot be negative")
        BigDecimal unitPrice,

        /** Optional on create (defaults to ACTIVE); use it to retire or revive an item. */
        InventoryStatus status
) {}
