package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.common.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);

    Optional<Booking> findByIdAndUserId(Long id, Long userId);

    Optional<Booking> findByBookingReferenceAndUserId(String bookingReference, Long userId);

    boolean existsByBookingReference(String bookingReference);

    /** Holds whose payment window has passed — used by the expiry sweeper. */
    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime cutoff);
}
