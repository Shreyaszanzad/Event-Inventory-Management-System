package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.enums.AllocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventInventoryRepository extends JpaRepository<EventInventory, Long> {

    List<EventInventory> findByEventIdOrderByAllocatedAtDesc(Long eventId);

    List<EventInventory> findByInventoryItemId(Long inventoryItemId);

    Optional<EventInventory> findByEventIdAndInventoryItemId(Long eventId, Long inventoryItemId);

    /** Guards item deletion: kit that is still out on an event must not disappear. */
    boolean existsByInventoryItemIdAndStatus(Long inventoryItemId, AllocationStatus status);
}
