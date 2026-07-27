package com.softpoly.eventinventory.booking.dto;

import com.softpoly.eventinventory.booking.BookingItem;

import java.math.BigDecimal;

public record BookingItemResponse(
        Long ticketTypeId,
        Integer quantity,
        BigDecimal unitPrice
) {
    public static BookingItemResponse from(BookingItem i) {
        return new BookingItemResponse(i.getTicketTypeId(), i.getQuantity(), i.getUnitPrice());
    }
}
