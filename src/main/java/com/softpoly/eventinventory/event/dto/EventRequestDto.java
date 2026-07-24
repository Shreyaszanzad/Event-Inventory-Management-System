package com.softpoly.eventinventory.event.dto;

import com.softpoly.eventinventory.common.enums.EventCategory;
import com.softpoly.eventinventory.common.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record EventRequestDto(
        @NotBlank(message = "Title is required") String title,
        String description,
        @NotNull(message = "Type is required (TICKETED or INVENTORY)") EventType type,
        EventCategory category,
        String venueName,
        String city,
        String posterUrl,
        LocalDateTime startTime
) {}
