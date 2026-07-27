package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.booking.dto.BookingResponse;
import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.event.Event;
import com.softpoly.eventinventory.event.EventRepository;
import com.softpoly.eventinventory.show.Show;
import com.softpoly.eventinventory.show.ShowRepository;
import com.softpoly.eventinventory.show.TicketType;
import com.softpoly.eventinventory.show.TicketTypeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Covers the hold -> confirm -> expiry lifecycle and its effect on seat inventory. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimstest;DB_CLOSE_DELAY=-1;MODE=MySQL;LOCK_TIMEOUT=15000",
        "app.booking.sweeper-initial-ms=3600000"
})
class BookingLifecycleTest {

    @Autowired EventRepository eventRepository;
    @Autowired ShowRepository showRepository;
    @Autowired TicketTypeRepository ticketTypeRepository;
    @Autowired BookingRepository bookingRepository;
    @Autowired BookingService bookingService;

    private long tierId;
    private long showId;

    private void setupTier(int capacity) {
        Event event = eventRepository.save(Event.builder()
                .title("Lifecycle Show").type(EventType.TICKETED).status("ACTIVE").build());
        Show show = showRepository.save(Show.builder()
                .eventId(event.getId()).showDatetime(LocalDateTime.now().plusDays(1)).build());
        TicketType tier = ticketTypeRepository.save(TicketType.builder()
                .showId(show.getId()).name("General").price(new BigDecimal("100"))
                .totalQty(capacity).availableQty(capacity).build());
        this.tierId = tier.getId();
        this.showId = show.getId();
    }

    private CreateBookingRequest bookOne() {
        return new CreateBookingRequest(showId, List.of(new CreateBookingRequest.Item(tierId, 1)));
    }

    private int available() {
        return ticketTypeRepository.findById(tierId).orElseThrow().getAvailableQty();
    }

    @Test
    void newBookingIsAPendingHoldThatReservesSeats() {
        setupTier(5);
        BookingResponse b = bookingService.create(1L, bookOne());
        assertThat(b.status()).isEqualTo("PENDING");
        assertThat(b.expiresAt()).isNotNull();
        assertThat(available()).isEqualTo(4); // seat reserved by the hold
    }

    @Test
    void confirmingAHoldSecuresItAndMarksPaid() {
        setupTier(5);
        BookingResponse held = bookingService.create(1L, bookOne());
        BookingResponse confirmed = bookingService.confirm(1L, held.id());
        assertThat(confirmed.status()).isEqualTo("CONFIRMED");
        assertThat(confirmed.paymentStatus()).isEqualTo("PAID");
        assertThat(confirmed.expiresAt()).isNull();
        assertThat(available()).isEqualTo(4); // still reserved, now paid
    }

    @Test
    void expiredHoldIsReleasedAndSeatsReturned() {
        setupTier(5);
        BookingResponse held = bookingService.create(1L, bookOne());
        assertThat(available()).isEqualTo(4);

        // force the hold's window into the past, then run the sweeper
        Booking booking = bookingRepository.findById(held.id()).orElseThrow();
        booking.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        bookingRepository.save(booking);

        int released = bookingService.releaseExpiredHolds();

        assertThat(released).isEqualTo(1);
        assertThat(bookingRepository.findById(held.id()).orElseThrow().getStatus().name()).isEqualTo("EXPIRED");
        assertThat(available()).isEqualTo(5); // seat returned to inventory
    }

    @Test
    void cannotConfirmAnAlreadyConfirmedBooking() {
        setupTier(5);
        BookingResponse held = bookingService.create(1L, bookOne());
        bookingService.confirm(1L, held.id());
        assertThatThrownBy(() -> bookingService.confirm(1L, held.id()))
                .isInstanceOf(BadRequestException.class);
    }
}
