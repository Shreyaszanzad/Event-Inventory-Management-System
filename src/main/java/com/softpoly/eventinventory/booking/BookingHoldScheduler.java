package com.softpoly.eventinventory.booking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically releases seats held by bookings whose payment window has expired. */
@Component
public class BookingHoldScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingHoldScheduler.class);

    private final BookingService bookingService;

    public BookingHoldScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelayString = "${app.booking.sweeper-ms}",
               initialDelayString = "${app.booking.sweeper-initial-ms}")
    public void sweepExpiredHolds() {
        try {
            int released = bookingService.releaseExpiredHolds();
            if (released > 0) {
                log.info("Released {} expired booking hold(s)", released);
            }
        } catch (Exception ex) {
            log.warn("Expired-hold sweep failed, will retry next cycle", ex);
        }
    }
}
