package com.softpoly.eventinventory.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    boolean existsByBookingId(Long bookingId);

    boolean existsByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByUserIdOrderByInvoiceDateDesc(Long userId);

    Optional<Invoice> findByIdAndUserId(Long id, Long userId);
}
