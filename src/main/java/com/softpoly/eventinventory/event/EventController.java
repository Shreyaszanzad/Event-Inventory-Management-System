package com.softpoly.eventinventory.event;

import com.softpoly.eventinventory.common.dto.ApiResponse;
import com.softpoly.eventinventory.event.dto.EventRequestDto;
import com.softpoly.eventinventory.event.dto.EventResponseDto;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public read endpoints live under /api/events (GET is permitted for everyone).
 * Admin write endpoints live under /api/admin/events (ROLE_ADMIN only, enforced by SecurityConfig).
 */
@RestController
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // ---------- Public ----------

    @GetMapping("/api/events")
    public ApiResponse<List<EventResponseDto>> listPublic() {
        return ApiResponse.ok(eventService.listPublicEvents());
    }

    @GetMapping("/api/events/{id}")
    public ApiResponse<EventResponseDto> getOne(@PathVariable Long id) {
        return ApiResponse.ok(eventService.getById(id));
    }

    // ---------- Admin ----------

    @GetMapping("/api/admin/events")
    public ApiResponse<List<EventResponseDto>> listAll() {
        return ApiResponse.ok(eventService.listAllEvents());
    }

    @PostMapping("/api/admin/events")
    public ApiResponse<EventResponseDto> create(@Valid @RequestBody EventRequestDto dto,
                                                Authentication authentication) {
        Long adminId = Long.valueOf(authentication.getName()); // JWT subject = user id
        return ApiResponse.ok("Event created", eventService.create(dto, adminId));
    }

    @PutMapping("/api/admin/events/{id}")
    public ApiResponse<EventResponseDto> update(@PathVariable Long id,
                                                @Valid @RequestBody EventRequestDto dto) {
        return ApiResponse.ok("Event updated", eventService.update(id, dto));
    }

    @DeleteMapping("/api/admin/events/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ApiResponse.ok("Event deleted", null);
    }
}
