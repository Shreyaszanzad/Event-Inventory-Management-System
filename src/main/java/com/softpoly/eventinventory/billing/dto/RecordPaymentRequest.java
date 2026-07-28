package com.softpoly.eventinventory.billing.dto;

import com.softpoly.eventinventory.common.enums.PaymentMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RecordPaymentRequest(
        @NotNull(message = "amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
        BigDecimal amount,

        @NotNull(message = "payment mode is required") PaymentMode mode
) {}
