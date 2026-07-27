package com.softpoly.eventinventory.booking.dto;

import com.softpoly.eventinventory.booking.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        Long showId,
        BigDecimal totalAmount,
        String paymentStatus,
        String status,
        LocalDateTime bookingDate,
        List<BookingItemResponse> items
) {
    public static BookingResponse from(Booking b) {
        return new BookingResponse(
                b.getId(),
                b.getShowId(),
                b.getTotalAmount(),
                b.getPaymentStatus().name(),
                b.getStatus().name(),
                b.getBookingDate(),
                b.getItems().stream().map(BookingItemResponse::from).toList()
        );
    }
}
