package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.enums.EventType;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The overbooking guarantee under real concurrency: many threads racing for a few seats must
 * NEVER oversell. This protects the guarded-decrement logic in {@link BookingService}.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimstest;DB_CLOSE_DELAY=-1;MODE=MySQL;LOCK_TIMEOUT=15000",
        "app.booking.sweeper-initial-ms=3600000"
})
class BookingConcurrencyTest {

    @Autowired EventRepository eventRepository;
    @Autowired ShowRepository showRepository;
    @Autowired TicketTypeRepository ticketTypeRepository;
    @Autowired BookingService bookingService;

    @Test
    void concurrentBookingsNeverOversellSeats() throws Exception {
        int capacity = 5;
        int threads = 20;

        Event event = eventRepository.save(Event.builder()
                .title("Concurrency Show").type(EventType.TICKETED).status("ACTIVE").build());
        Show show = showRepository.save(Show.builder()
                .eventId(event.getId()).showDatetime(LocalDateTime.now().plusDays(1)).build());
        TicketType tier = ticketTypeRepository.save(TicketType.builder()
                .showId(show.getId()).name("General").price(new BigDecimal("100"))
                .totalQty(capacity).availableQty(capacity).build());

        CreateBookingRequest request = new CreateBookingRequest(
                show.getId(), List.of(new CreateBookingRequest.Item(tier.getId(), 1)));

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            final long userId = i + 1L;
            pool.submit(() -> {
                try {
                    start.await();                 // everyone waits, then races together
                    bookingService.create(userId, request);
                    success.incrementAndGet();
                } catch (Exception e) {
                    rejected.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }
        start.countDown();
        done.await(30, TimeUnit.SECONDS);
        pool.shutdownNow();

        int remaining = ticketTypeRepository.findById(tier.getId()).orElseThrow().getAvailableQty();

        assertThat(success.get()).as("exactly capacity bookings succeed").isEqualTo(capacity);
        assertThat(rejected.get()).as("the rest are rejected").isEqualTo(threads - capacity);
        assertThat(remaining).as("never negative, never leftover").isZero();
    }
}
