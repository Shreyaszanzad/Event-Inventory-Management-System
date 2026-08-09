package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.dto.ApiResponse;
import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.common.enums.InventoryStatus;
import com.softpoly.eventinventory.inventory.dto.AllocateInventoryRequest;
import com.softpoly.eventinventory.inventory.dto.EventInventoryResponse;
import com.softpoly.eventinventory.inventory.dto.InventoryItemRequest;
import com.softpoly.eventinventory.inventory.dto.InventoryItemResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Inventory is entirely admin-facing — nothing here is public, so every path sits under
 * {@code /api/admin/**} and inherits the ROLE_ADMIN rule from SecurityConfig. Customers never
 * see chairs and speakers; they see shows and tickets.
 */
@RestController
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // ---------- Catalogue ----------

    /** Optionally filter by {@code category} and/or {@code status}. */
    @GetMapping("/api/admin/inventory")
    public ApiResponse<List<InventoryItemResponse>> list(
            @RequestParam(required = false) InventoryCategory category,
            @RequestParam(required = false) InventoryStatus status) {
        return ApiResponse.ok(inventoryService.list(category, status));
    }

    @GetMapping("/api/admin/inventory/{id}")
    public ApiResponse<InventoryItemResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(inventoryService.get(id));
    }

    @PostMapping("/api/admin/inventory")
    public ApiResponse<InventoryItemResponse> create(@Valid @RequestBody InventoryItemRequest dto) {
        return ApiResponse.ok("Inventory item created", inventoryService.create(dto));
    }

    @PutMapping("/api/admin/inventory/{id}")
    public ApiResponse<InventoryItemResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody InventoryItemRequest dto) {
        return ApiResponse.ok("Inventory item updated", inventoryService.update(id, dto));
    }

    @DeleteMapping("/api/admin/inventory/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        inventoryService.delete(id);
        return ApiResponse.ok("Inventory item deleted", null);
    }

    // ---------- Allocation to events ----------

    @GetMapping("/api/admin/events/{eventId}/inventory")
    public ApiResponse<List<EventInventoryResponse>> listForEvent(@PathVariable Long eventId) {
        return ApiResponse.ok(inventoryService.listForEvent(eventId));
    }

    @PostMapping("/api/admin/events/{eventId}/inventory")
    public ApiResponse<EventInventoryResponse> allocate(@PathVariable Long eventId,
                                                        @Valid @RequestBody AllocateInventoryRequest dto) {
        return ApiResponse.ok("Inventory allocated", inventoryService.allocate(eventId, dto));
    }

    @PutMapping("/api/admin/inventory-allocations/{id}")
    public ApiResponse<EventInventoryResponse> updateAllocation(@PathVariable Long id,
                                                                @Valid @RequestBody UpdateAllocationRequest dto) {
        return ApiResponse.ok("Allocation updated", inventoryService.updateAllocation(id, dto.quantity()));
    }

    /**
     * End an allocation and return its stock to the pool.
     *
     * @param returned {@code true} (default) records the kit as RETURNED; {@code false} marks the
     *                 allocation CANCELLED, for kit that never left the store.
     */
    @DeleteMapping("/api/admin/inventory-allocations/{id}")
    public ApiResponse<EventInventoryResponse> release(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean returned) {
        EventInventoryResponse released = inventoryService.release(id, returned);
        return ApiResponse.ok(returned ? "Inventory returned" : "Allocation cancelled", released);
    }

    /** Body for resizing an allocation. */
    public record UpdateAllocationRequest(
            @NotNull(message = "quantity is required")
            @Min(value = 1, message = "quantity must be at least 1")
            Integer quantity
    ) {}
}
