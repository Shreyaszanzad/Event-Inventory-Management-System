package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.enums.AllocationStatus;
import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.common.enums.InventoryStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.common.time.AppTime;
import com.softpoly.eventinventory.event.Event;
import com.softpoly.eventinventory.event.EventRepository;
import com.softpoly.eventinventory.inventory.dto.AllocateInventoryRequest;
import com.softpoly.eventinventory.inventory.dto.EventInventoryResponse;
import com.softpoly.eventinventory.inventory.dto.InventoryItemRequest;
import com.softpoly.eventinventory.inventory.dto.InventoryItemResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Inventory catalogue and event allocation.
 *
 * <p>The one rule worth stating up front: <b>stock only ever moves through
 * {@link InventoryItemRepository#allocateStock} and {@code releaseStock}</b>. Neither this class
 * nor any caller sets {@code availableQty} by hand, because the guard inside those queries is
 * the only thing standing between us and two admins allocating the same speakers at once.
 */
@Service
public class InventoryService {

    private final InventoryItemRepository itemRepository;
    private final EventInventoryRepository allocationRepository;
    private final EventRepository eventRepository;

    public InventoryService(InventoryItemRepository itemRepository,
                            EventInventoryRepository allocationRepository,
                            EventRepository eventRepository) {
        this.itemRepository = itemRepository;
        this.allocationRepository = allocationRepository;
        this.eventRepository = eventRepository;
    }

    // ------------------------------------------------------------------
    // Catalogue
    // ------------------------------------------------------------------

    @Transactional
    public InventoryItemResponse create(InventoryItemRequest dto) {
        InventoryItem item = InventoryItem.builder()
                .name(dto.name().trim())
                .description(dto.description())
                .category(dto.category())
                .totalQty(dto.totalQty())
                .availableQty(dto.totalQty())   // nothing is allocated yet
                .unitPrice(dto.unitPrice())
                .status(dto.status() == null ? InventoryStatus.ACTIVE : dto.status())
                .build();
        return InventoryItemResponse.from(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> list(InventoryCategory category, InventoryStatus status) {
        List<InventoryItem> items;
        if (category != null) {
            items = itemRepository.findByCategory(category);
        } else if (status != null) {
            items = itemRepository.findByStatus(status);
        } else {
            items = itemRepository.findAll();
        }
        return items.stream()
                .filter(i -> category == null || i.getCategory() == category)
                .filter(i -> status == null || i.getStatus() == status)
                .sorted(Comparator.comparing(InventoryItem::getId))
                .map(InventoryItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse get(Long id) {
        return InventoryItemResponse.from(findItemOrThrow(id));
    }

    /**
     * Update an item. Capacity may not drop below what is already out on events — the same
     * guard {@code TicketTypeService.update} applies when shrinking a tier.
     */
    @Transactional
    public InventoryItemResponse update(Long id, InventoryItemRequest dto) {
        InventoryItem item = findItemOrThrow(id);
        int alreadyAllocated = item.allocatedQty();

        if (dto.totalQty() < alreadyAllocated) {
            throw new BadRequestException(
                    "Cannot set total quantity below the " + alreadyAllocated
                            + " unit(s) already allocated to events");
        }

        item.setName(dto.name().trim());
        item.setDescription(dto.description());
        item.setCategory(dto.category());
        item.setTotalQty(dto.totalQty());
        item.setAvailableQty(dto.totalQty() - alreadyAllocated);
        item.setUnitPrice(dto.unitPrice());
        if (dto.status() != null) {
            item.setStatus(dto.status());
        }
        return InventoryItemResponse.from(itemRepository.save(item));
    }

    /**
     * Delete an item outright. Refused while any allocation still holds stock — retire the item
     * instead if you want to keep its history.
     */
    @Transactional
    public void delete(Long id) {
        InventoryItem item = findItemOrThrow(id);

        if (allocationRepository.existsByInventoryItemIdAndStatus(id, AllocationStatus.ALLOCATED)) {
            throw new BadRequestException(
                    "This item is still allocated to one or more events. Release those allocations "
                            + "first, or set its status to RETIRED to take it out of circulation.");
        }
        if (!allocationRepository.findByInventoryItemId(id).isEmpty()) {
            throw new BadRequestException(
                    "This item has allocation history and cannot be deleted. "
                            + "Set its status to RETIRED instead.");
        }
        itemRepository.delete(item);
    }

    // ------------------------------------------------------------------
    // Allocation
    // ------------------------------------------------------------------

    /**
     * Put {@code quantity} of an item on an event.
     *
     * <p>An event holds at most one row per item, so allocating something already allocated is
     * rejected with a pointer at the update endpoint rather than silently creating a second row.
     */
    @Transactional
    public EventInventoryResponse allocate(Long eventId, AllocateInventoryRequest dto) {
        requireInventoryEvent(eventId);
        InventoryItem item = findItemOrThrow(dto.inventoryItemId());

        if (item.getStatus() == InventoryStatus.RETIRED) {
            throw new BadRequestException("'" + item.getName() + "' is retired and cannot be allocated");
        }

        allocationRepository.findByEventIdAndInventoryItemId(eventId, item.getId())
                .filter(EventInventory::isHoldingStock)
                .ifPresent(existing -> {
                    throw new BadRequestException(
                            "'" + item.getName() + "' is already allocated to this event ("
                                    + existing.getAllocatedQty() + " unit(s)). "
                                    + "Update allocation " + existing.getId() + " to change the quantity.");
                });

        takeStockOrThrow(item, dto.quantity());

        // A previous allocation of the same item may have been returned/cancelled; reuse that row
        // so the unique constraint holds and the event keeps a single line per item.
        EventInventory allocation = allocationRepository
                .findByEventIdAndInventoryItemId(eventId, item.getId())
                .orElseGet(() -> EventInventory.builder()
                        .eventId(eventId)
                        .inventoryItemId(item.getId())
                        .build());

        allocation.setAllocatedQty(dto.quantity());
        allocation.setNotes(dto.notes());
        allocation.setStatus(AllocationStatus.ALLOCATED);
        allocation.setReleasedAt(null);
        if (allocation.getAllocatedAt() == null) {
            allocation.setAllocatedAt(AppTime.now());
        }

        EventInventory saved = allocationRepository.save(allocation);
        return EventInventoryResponse.from(saved, itemRepository.findById(item.getId()).orElse(item));
    }

    @Transactional(readOnly = true)
    public List<EventInventoryResponse> listForEvent(Long eventId) {
        requireInventoryEvent(eventId);
        List<EventInventory> allocations = allocationRepository.findByEventIdOrderByAllocatedAtDesc(eventId);
        Map<Long, InventoryItem> itemsById = loadItems(allocations);

        return allocations.stream()
                .map(a -> EventInventoryResponse.from(a, itemsById.get(a.getInventoryItemId())))
                .toList();
    }

    /**
     * Change how much of an item an event holds. The delta is what moves — asking for 2 more
     * takes 2 from the pool, asking for 3 fewer puts 3 back.
     */
    @Transactional
    public EventInventoryResponse updateAllocation(Long allocationId, int newQuantity) {
        if (newQuantity < 1) {
            throw new BadRequestException("quantity must be at least 1; release the allocation instead");
        }

        EventInventory allocation = findAllocationOrThrow(allocationId);
        if (!allocation.isHoldingStock()) {
            throw new BadRequestException(
                    "This allocation is already " + allocation.getStatus().name().toLowerCase()
                            + " and cannot be resized");
        }

        InventoryItem item = findItemOrThrow(allocation.getInventoryItemId());
        int delta = newQuantity - allocation.getAllocatedQty();

        if (delta > 0) {
            takeStockOrThrow(item, delta);
        } else if (delta < 0) {
            itemRepository.releaseStock(item.getId(), -delta);
        }

        allocation.setAllocatedQty(newQuantity);
        EventInventory saved = allocationRepository.save(allocation);
        return EventInventoryResponse.from(saved, itemRepository.findById(item.getId()).orElse(item));
    }

    /**
     * End an allocation and put its stock back.
     *
     * @param returned true when the kit came back from the event (RETURNED), false when the
     *                 allocation was called off before it went out (CANCELLED)
     */
    @Transactional
    public EventInventoryResponse release(Long allocationId, boolean returned) {
        EventInventory allocation = findAllocationOrThrow(allocationId);

        if (!allocation.isHoldingStock()) {
            throw new BadRequestException(
                    "This allocation is already " + allocation.getStatus().name().toLowerCase());
        }

        itemRepository.releaseStock(allocation.getInventoryItemId(), allocation.getAllocatedQty());

        allocation.setStatus(returned ? AllocationStatus.RETURNED : AllocationStatus.CANCELLED);
        allocation.setReleasedAt(AppTime.now());

        EventInventory saved = allocationRepository.save(allocation);
        InventoryItem item = itemRepository.findById(allocation.getInventoryItemId()).orElse(null);
        return EventInventoryResponse.from(saved, item);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Take stock via the guarded update. A zero row-count means the guard refused: either the
     * pool really is short, or a concurrent allocation beat us to it.
     *
     * <p>The count quoted back is the one this transaction last read. Under contention it can
     * lag the true figure by moments — but the refusal itself is authoritative, which is the
     * part that matters. Deliberately no re-read here: {@code item} is still managed, so a
     * {@code findById} would hand back the same cached instance anyway.
     */
    private void takeStockOrThrow(InventoryItem item, int qty) {
        if (itemRepository.allocateStock(item.getId(), qty) == 0) {
            throw new BadRequestException(
                    "Not enough stock: '" + item.getName() + "' has " + item.getAvailableQty()
                            + " unit(s) available, but " + qty + " were requested");
        }
    }

    private Map<Long, InventoryItem> loadItems(List<EventInventory> allocations) {
        List<Long> ids = allocations.stream().map(EventInventory::getInventoryItemId).distinct().toList();
        return itemRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(InventoryItem::getId, Function.identity()));
    }

    /**
     * Inventory belongs to INVENTORY-type events only.
     *
     * <p>That is what the {@code type} discriminator on Event is for: TICKETED events sell seats
     * through shows and ticket tiers, INVENTORY events consume physical stock. Allowing kit to be
     * hung off a ticketed concert would make the discriminator meaningless and put equipment in
     * the customer-facing booking flow, where it has no business being.
     */
    private void requireInventoryEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id " + eventId));

        if (event.getType() != EventType.INVENTORY) {
            throw new BadRequestException(
                    "'" + event.getTitle() + "' is a " + event.getType()
                            + " event. Inventory can only be allocated to INVENTORY-type events.");
        }
    }

    private InventoryItem findItemOrThrow(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id " + id));
    }

    private EventInventory findAllocationOrThrow(Long id) {
        return allocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation not found with id " + id));
    }
}
