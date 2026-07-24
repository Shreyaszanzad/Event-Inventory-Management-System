package com.softpoly.eventinventory.event.dto;

import com.softpoly.eventinventory.common.enums.EventCategory;
import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.event.Event;

import java.time.LocalDateTime;

public record EventResponseDto(
        Long id,
        String title,
        String description,
        EventType type,
        EventCategory category,
        String venueName,
        String city,
        String posterUrl,
        LocalDateTime startTime,
        String status
) {
    public static EventResponseDto from(Event e) {
        return new EventResponseDto(
                e.getId(), e.getTitle(), e.getDescription(), e.getType(), e.getCategory(),
                e.getVenueName(), e.getCity(), e.getPosterUrl(), e.getStartTime(), e.getStatus());
    }
}
