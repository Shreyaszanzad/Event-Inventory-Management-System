package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.common.enums.InventoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByCategory(InventoryCategory category);

    List<InventoryItem> findByStatus(InventoryStatus status);

    /**
     * Atomically take {@code qty} out of the available pool, but only if that much is free.
     * Returns 1 on success and 0 if there wasn't enough — the {@code >= :qty} guard in the
     * WHERE clause is what stops two admins allocating the same speakers at the same moment.
     *
     * <p>Same shape as {@code TicketTypeRepository.decrementStock}; the two should stay in
     * step, because they are solving exactly the same race.
     */
    @Modifying
    @Query("update InventoryItem i set i.availableQty = i.availableQty - :qty " +
           "where i.id = :id and i.availableQty >= :qty")
    int allocateStock(@Param("id") Long id, @Param("qty") int qty);

    /** Return stock to the pool when an allocation ends, capped at what we actually own. */
    @Modifying
    @Query("update InventoryItem i set i.availableQty = " +
           "case when i.availableQty + :qty > i.totalQty then i.totalQty else i.availableQty + :qty end " +
           "where i.id = :id")
    int releaseStock(@Param("id") Long id, @Param("qty") int qty);
}
