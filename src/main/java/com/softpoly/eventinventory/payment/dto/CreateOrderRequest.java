package com.softpoly.eventinventory.payment.dto;

import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotNull(message = "invoiceId is required") Long invoiceId
) {}
