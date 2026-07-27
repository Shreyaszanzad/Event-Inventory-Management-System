package com.softpoly.eventinventory.show;

import com.softpoly.eventinventory.common.dto.ApiResponse;
import com.softpoly.eventinventory.show.dto.TicketTypeRequest;
import com.softpoly.eventinventory.show.dto.TicketTypeResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public read of a show's ticket tiers; admin writes under /api/admin/**. */
@RestController
public class TicketTypeController {

    private final TicketTypeService ticketTypeService;

    public TicketTypeController(TicketTypeService ticketTypeService) {
        this.ticketTypeService = ticketTypeService;
    }

    // ---------- Public ----------

    @GetMapping("/api/shows/{showId}/ticket-types")
    public ApiResponse<List<TicketTypeResponse>> listForShow(@PathVariable Long showId) {
        return ApiResponse.ok(ticketTypeService.listByShow(showId));
    }

    // ---------- Admin ----------

    @PostMapping("/api/admin/shows/{showId}/ticket-types")
    public ApiResponse<TicketTypeResponse> create(@PathVariable Long showId,
                                                  @Valid @RequestBody TicketTypeRequest dto) {
        return ApiResponse.ok("Ticket type created", ticketTypeService.create(showId, dto));
    }

    @PutMapping("/api/admin/ticket-types/{id}")
    public ApiResponse<TicketTypeResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody TicketTypeRequest dto) {
        return ApiResponse.ok("Ticket type updated", ticketTypeService.update(id, dto));
    }

    @DeleteMapping("/api/admin/ticket-types/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        ticketTypeService.delete(id);
        return ApiResponse.ok("Ticket type deleted", null);
    }
}
