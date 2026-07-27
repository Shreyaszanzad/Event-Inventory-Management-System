package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.booking.dto.BookingResponse;
import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.show.Show;
import com.softpoly.eventinventory.show.ShowRepository;
import com.softpoly.eventinventory.show.TicketType;
import com.softpoly.eventinventory.show.TicketTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BookingService {

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

        Booking booking = Booking.builder().userId(userId).showId(show.getId()).build();
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
}
