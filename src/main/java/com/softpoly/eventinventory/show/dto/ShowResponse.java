package com.softpoly.eventinventory.show.dto;

import com.softpoly.eventinventory.show.Show;

import java.time.LocalDateTime;

public record ShowResponse(
        Long id,
        Long eventId,
        LocalDateTime showDatetime,
        String status
) {
    public static ShowResponse from(Show s) {
        return new ShowResponse(s.getId(), s.getEventId(), s.getShowDatetime(), s.getStatus());
    }
}
