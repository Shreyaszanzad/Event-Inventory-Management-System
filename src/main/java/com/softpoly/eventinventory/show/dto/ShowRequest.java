package com.softpoly.eventinventory.show.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ShowRequest(
        @NotNull(message = "Show date/time is required") LocalDateTime showDatetime
) {}
