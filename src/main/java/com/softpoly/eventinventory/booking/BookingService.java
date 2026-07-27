package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.booking.dto.BookingResponse;
import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.enums.BookingStatus;
import com.softpoly.eventinventory.common.enums.PaymentStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.show.Show;
import com.softpoly.eventinventory.show.ShowRepository;
import com.softpoly.eventinventory.show.TicketType;
import com.softpoly.eventinventory.show.TicketTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    // Excludes easily-confused characters (0/O, 1/I) so codes are readable on a ticket.
    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final BookingRepository bookingRepository;
    private final ShowRepository showRepository;
    private final TicketTypeRepository ticketTypeRepository;

    public BookingService(BookingRepository bookingRepository, ShowRepository showRepository,
                          TicketTypeRepository ticketTypeRepository) {
        this.bookingRepository = bookingRepository;
        this.showRepository = showRepository;
        this.ticketTypeRepository = ticketTypeRepository;
    }

    /**
     * Creates a booking for the given user. All items succeed or the whole booking is rolled back:
     * stock is decremented with a guarded UPDATE, so concurrent bookings can never oversell.
     */
    @Transactional
    public BookingResponse create(Long userId, CreateBookingRequest request) {
        Show show = showRepository.findById(request.showId())
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id " + request.showId()));
        if (!"ACTIVE".equals(show.getStatus())) {
            throw new BadRequestException("This show is not available for booking");
        }

        Booking booking = Booking.builder()
                .userId(userId)
                .showId(show.getId())
                .bookingReference(generateReference())
                .build();
        BigDecimal total = BigDecimal.ZERO;

        for (CreateBookingRequest.Item item : request.items()) {
            TicketType ticketType = ticketTypeRepository.findById(item.ticketTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Ticket type not found with id " + item.ticketTypeId()));

            if (!ticketType.getShowId().equals(show.getId())) {
                throw new BadRequestException("Ticket type " + ticketType.getId()
                        + " does not belong to show " + show.getId());
            }

            // Guarded, atomic decrement. 0 rows updated => not enough stock => roll everything back.
            int updated = ticketTypeRepository.decrementStock(ticketType.getId(), item.quantity());
            if (updated == 0) {
                throw new BadRequestException("Not enough tickets available for " + ticketType.getName());
            }

            BookingItem bookingItem = BookingItem.builder()
                    .ticketTypeId(ticketType.getId())
                    .quantity(item.quantity())
                    .unitPrice(ticketType.getPrice())
                    .build();
            booking.addItem(bookingItem);

            total = total.add(ticketType.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
        }

        booking.setTotalAmount(total);
        return BookingResponse.from(bookingRepository.save(booking));
    }

    /**
     * Cancels a user's own booking and releases the seats back into inventory.
     * Allowed only before the show starts and only if not already cancelled.
     * Payment is status-only: a previously PAID booking is marked REFUNDED.
     */
    @Transactional
    public BookingResponse cancel(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        Show show = showRepository.findById(booking.getShowId()).orElse(null);
        if (show != null && show.getShowDatetime() != null
                && show.getShowDatetime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot cancel after the show has started");
        }

        // Release each tier's seats back into availability.
        for (BookingItem item : booking.getItems()) {
            ticketTypeRepository.incrementStock(item.getTicketTypeId(), item.getQuantity());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.REFUNDED); // real gateway refund happens later
        }
        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listMyBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByBookingDateDesc(userId).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getMyBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + bookingId));
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getMyBookingByReference(Long userId, String reference) {
        Booking booking = bookingRepository.findByBookingReferenceAndUserId(reference, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference " + reference));
        return BookingResponse.from(booking);
    }

    /** Generates a unique, human-readable booking reference, retrying on the rare collision. */
    private String generateReference() {
        String reference;
        do {
            StringBuilder sb = new StringBuilder("EVB-");
            for (int i = 0; i < 8; i++) {
                sb.append(REF_ALPHABET.charAt(RANDOM.nextInt(REF_ALPHABET.length())));
            }
            reference = sb.toString();
        } while (bookingRepository.existsByBookingReference(reference));
        return reference;
    }
}
