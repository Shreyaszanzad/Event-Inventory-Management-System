package com.softpoly.eventinventory.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Assign a quantity of one inventory item to an event. */
public record AllocateInventoryRequest(

        @NotNull(message = "inventoryItemId is required")
        Long inventoryItemId,

        @NotNull(message = "quantity is required")
        @Min(value = 1, message = "quantity must be at least 1")
        Integer quantity,

        @Size(max = 500, message = "Notes must be at most 500 characters")
        String notes
) {}
