package com.softpoly.eventinventory.show;

import com.softpoly.eventinventory.common.dto.ApiResponse;
import com.softpoly.eventinventory.show.dto.ShowRequest;
import com.softpoly.eventinventory.show.dto.ShowResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public reads under /api/events/{id}/shows and /api/shows/{id}; admin writes under /api/admin/**.
 */
@RestController
public class ShowController {

    private final ShowService showService;

    public ShowController(ShowService showService) {
        this.showService = showService;
    }

    // ---------- Public ----------

    @GetMapping("/api/events/{eventId}/shows")
    public ApiResponse<List<ShowResponse>> listForEvent(@PathVariable Long eventId) {
        return ApiResponse.ok(showService.listByEvent(eventId));
    }

    @GetMapping("/api/shows/{showId}")
    public ApiResponse<ShowResponse> getOne(@PathVariable Long showId) {
        return ApiResponse.ok(showService.getById(showId));
    }

    // ---------- Admin ----------

    @PostMapping("/api/admin/events/{eventId}/shows")
    public ApiResponse<ShowResponse> create(@PathVariable Long eventId, @Valid @RequestBody ShowRequest dto) {
        return ApiResponse.ok("Show created", showService.create(eventId, dto));
    }

    @PutMapping("/api/admin/shows/{showId}")
    public ApiResponse<ShowResponse> update(@PathVariable Long showId, @Valid @RequestBody ShowRequest dto) {
        return ApiResponse.ok("Show updated", showService.update(showId, dto));
    }

    @DeleteMapping("/api/admin/shows/{showId}")
    public ApiResponse<Void> delete(@PathVariable Long showId) {
        showService.delete(showId);
        return ApiResponse.ok("Show deleted", null);
    }
}
