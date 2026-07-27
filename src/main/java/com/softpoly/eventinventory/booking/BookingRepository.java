package com.softpoly.eventinventory.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);

    Optional<Booking> findByIdAndUserId(Long id, Long userId);
}
