package com.softpoly.eventinventory.show;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {

    List<TicketType> findByShowId(Long showId);

    /**
     * Atomically reduce stock only if enough remains. Returns 1 on success, 0 if there wasn't
     * enough — the WHERE guard is what prevents two concurrent bookings from overselling.
     */
    @Modifying
    @Query("update TicketType t set t.availableQty = t.availableQty - :qty " +
           "where t.id = :id and t.availableQty >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);

    /** Release seats back into inventory when a booking is cancelled (capped at total capacity). */
    @Modifying
    @Query("update TicketType t set t.availableQty = " +
           "case when t.availableQty + :qty > t.totalQty then t.totalQty else t.availableQty + :qty end " +
           "where t.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
