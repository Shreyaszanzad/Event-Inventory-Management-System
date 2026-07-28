package com.softpoly.eventinventory.billing.dto;

import com.softpoly.eventinventory.billing.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        BigDecimal amount,
        String mode,
        LocalDateTime paymentDate
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(p.getId(), p.getAmount(), p.getMode().name(), p.getPaymentDate());
    }
}
