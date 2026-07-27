package com.softpoly.eventinventory.booking.dto;

import com.softpoly.eventinventory.booking.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        String bookingReference,
        Long showId,
        BigDecimal totalAmount,
        String paymentStatus,
        String status,
        LocalDateTime bookingDate,
        LocalDateTime expiresAt,
        List<BookingItemResponse> items
) {
    public static BookingResponse from(Booking b) {
        return new BookingResponse(
                b.getId(),
                b.getBookingReference(),
                b.getShowId(),
                b.getTotalAmount(),
                b.getPaymentStatus().name(),
                b.getStatus().name(),
                b.getBookingDate(),
                b.getExpiresAt(),
                b.getItems().stream().map(BookingItemResponse::from).toList()
        );
    }
}
