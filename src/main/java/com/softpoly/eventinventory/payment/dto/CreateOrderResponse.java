package com.softpoly.eventinventory.payment.dto;

/** What the frontend needs to open the gateway checkout widget. */
public record CreateOrderResponse(
        String provider,
        String keyId,
        String orderId,
        long amountMinor,
        String currency,
        Long invoiceId,
        String invoiceNumber
) {}
