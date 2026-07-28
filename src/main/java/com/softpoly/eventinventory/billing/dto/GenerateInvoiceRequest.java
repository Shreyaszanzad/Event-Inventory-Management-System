package com.softpoly.eventinventory.billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record GenerateInvoiceRequest(
        @NotNull(message = "bookingId is required") Long bookingId,
        @DecimalMin(value = "0.0", message = "Discount cannot be negative") BigDecimal discount
) {
    /** Discount is optional; treat null as zero. */
    public BigDecimal discountOrZero() {
        return discount == null ? BigDecimal.ZERO : discount;
    }
}
