package com.softpoly.eventinventory.show.dto;

import com.softpoly.eventinventory.show.TicketType;

import java.math.BigDecimal;

public record TicketTypeResponse(
        Long id,
        Long showId,
        String name,
        BigDecimal price,
        Integer totalQty,
        Integer availableQty
) {
    public static TicketTypeResponse from(TicketType t) {
        return new TicketTypeResponse(t.getId(), t.getShowId(), t.getName(),
                t.getPrice(), t.getTotalQty(), t.getAvailableQty());
    }
}
