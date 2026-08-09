package com.softpoly.eventinventory.payment.dto;

import jakarta.validation.constraints.NotBlank;

/** Sent by the frontend after Razorpay checkout succeeds (its callback fields). */
public record VerifyPaymentRequest(
        @NotBlank(message = "orderId is required") String orderId,
        @NotBlank(message = "paymentId is required") String paymentId,
        @NotBlank(message = "signature is required") String signature
) {}
