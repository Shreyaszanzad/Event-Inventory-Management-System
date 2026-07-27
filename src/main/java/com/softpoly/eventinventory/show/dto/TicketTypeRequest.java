package com.softpoly.eventinventory.show.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TicketTypeRequest(
        @NotBlank(message = "Ticket type name is required") String name,
        @NotNull(message = "Price is required") @DecimalMin(value = "0.0", message = "Price cannot be negative") BigDecimal price,
        @NotNull(message = "Total quantity is required") @Min(value = 1, message = "Total quantity must be at least 1") Integer totalQty
) {}
