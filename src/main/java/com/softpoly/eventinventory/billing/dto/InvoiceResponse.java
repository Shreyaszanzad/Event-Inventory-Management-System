package com.softpoly.eventinventory.billing.dto;

import com.softpoly.eventinventory.billing.Invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        Long bookingId,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal balanceAmount,
        String status,
        LocalDateTime invoiceDate,
        List<PaymentResponse> payments
) {
    public static InvoiceResponse from(Invoice i) {
        return new InvoiceResponse(
                i.getId(), i.getInvoiceNumber(), i.getBookingId(),
                i.getSubtotal(), i.getDiscount(), i.getTotalAmount(),
                i.getPaidAmount(), i.getBalanceAmount(), i.getStatus().name(), i.getInvoiceDate(),
                i.getPayments().stream().map(PaymentResponse::from).toList()
        );
    }
}
