package com.softpoly.eventinventory.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateBookingRequest(
        @NotNull(message = "showId is required") Long showId,
        @NotEmpty(message = "At least one ticket item is required") @Valid List<Item> items
) {
    public record Item(
            @NotNull(message = "ticketTypeId is required") Long ticketTypeId,
            @Min(value = 1, message = "quantity must be at least 1") int quantity
    ) {}
}
