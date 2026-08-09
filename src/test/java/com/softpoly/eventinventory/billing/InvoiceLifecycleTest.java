package com.softpoly.eventinventory.billing;

import com.softpoly.eventinventory.billing.dto.GenerateInvoiceRequest;
import com.softpoly.eventinventory.billing.dto.InvoiceResponse;
import com.softpoly.eventinventory.billing.dto.RecordPaymentRequest;
import com.softpoly.eventinventory.booking.BookingRepository;
import com.softpoly.eventinventory.booking.BookingService;
import com.softpoly.eventinventory.booking.dto.BookingResponse;
import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.enums.PaymentMode;
import com.softpoly.eventinventory.common.enums.PaymentStatus;
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

/** Covers invoice generation, partial/full payment settlement, and the billing guard rules. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimstest;DB_CLOSE_DELAY=-1;MODE=MySQL;LOCK_TIMEOUT=15000",
        "app.booking.sweeper-initial-ms=3600000"
})
class InvoiceLifecycleTest {

    @Autowired EventRepository eventRepository;
    @Autowired ShowRepository showRepository;
    @Autowired TicketTypeRepository ticketTypeRepository;
    @Autowired BookingService bookingService;
    @Autowired BookingRepository bookingRepository;
    @Autowired InvoiceService invoiceService;

    /** Creates a booking of {@code qty} tickets at ₹300 each (subtotal = qty*300). */
    private BookingResponse newBooking(int qty) {
        Event event = eventRepository.save(Event.builder()
                .title("Billing Show").type(EventType.TICKETED).status("ACTIVE").build());
        Show show = showRepository.save(Show.builder()
                .eventId(event.getId()).showDatetime(LocalDateTime.now().plusDays(1)).build());
        TicketType tier = ticketTypeRepository.save(TicketType.builder()
                .showId(show.getId()).name("General").price(new BigDecimal("300"))
                .totalQty(100).availableQty(100).build());
        BookingResponse booking = bookingService.create(1L,
                new CreateBookingRequest(show.getId(), List.of(new CreateBookingRequest.Item(tier.getId(), qty))));
        // Only a confirmed booking can be invoiced, so every fixture here is confirmed.
        return bookingService.confirm(1L, booking.id());
    }

    /** A booking left as an unconfirmed PENDING hold. */
    private BookingResponse newPendingBooking(int qty) {
        Event event = eventRepository.save(Event.builder()
                .title("Pending Show").type(EventType.TICKETED).status("ACTIVE").build());
        Show show = showRepository.save(Show.builder()
                .eventId(event.getId()).showDatetime(LocalDateTime.now().plusDays(1)).build());
        TicketType tier = ticketTypeRepository.save(TicketType.builder()
                .showId(show.getId()).name("General").price(new BigDecimal("300"))
                .totalQty(100).availableQty(100).build());
        return bookingService.create(1L,
                new CreateBookingRequest(show.getId(), List.of(new CreateBookingRequest.Item(tier.getId(), qty))));
    }

    @Test
    void invoiceMirrorsBookingTotalAndStartsUnpaid() {
        BookingResponse booking = newBooking(2); // subtotal 600
        InvoiceResponse inv = invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null));

        assertThat(inv.invoiceNumber()).startsWith("INV-");
        assertThat(inv.subtotal()).isEqualByComparingTo("600");
        assertThat(inv.discount()).isEqualByComparingTo("0");
        assertThat(inv.totalAmount()).isEqualByComparingTo("600");
        assertThat(inv.balanceAmount()).isEqualByComparingTo("600");
        assertThat(inv.status()).isEqualTo("UNPAID");
    }

    @Test
    void discountReducesTheTotal() {
        BookingResponse booking = newBooking(2); // subtotal 600
        InvoiceResponse inv = invoiceService.generate(
                new GenerateInvoiceRequest(booking.id(), new BigDecimal("100")));
        assertThat(inv.totalAmount()).isEqualByComparingTo("500");
        assertThat(inv.balanceAmount()).isEqualByComparingTo("500");
    }

    @Test
    void partialThenFullPaymentSettlesInvoiceAndSyncsBooking() {
        BookingResponse booking = newBooking(2); // subtotal 600
        InvoiceResponse inv = invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null));

        InvoiceResponse afterPartial = invoiceService.recordPayment(inv.id(),
                new RecordPaymentRequest(new BigDecimal("200"), PaymentMode.CASH));
        assertThat(afterPartial.status()).isEqualTo("PARTIALLY_PAID");
        assertThat(afterPartial.paidAmount()).isEqualByComparingTo("200");
        assertThat(afterPartial.balanceAmount()).isEqualByComparingTo("400");

        InvoiceResponse settled = invoiceService.recordPayment(inv.id(),
                new RecordPaymentRequest(new BigDecimal("400"), PaymentMode.UPI));
        assertThat(settled.status()).isEqualTo("PAID");
        assertThat(settled.balanceAmount()).isEqualByComparingTo("0");
        assertThat(settled.payments()).hasSize(2);

        // booking's payment flag should now be PAID
        assertThat(bookingRepository.findById(booking.id()).orElseThrow().getPaymentStatus())
                .isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void cannotOverpayAnInvoice() {
        BookingResponse booking = newBooking(2); // total 600
        InvoiceResponse inv = invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null));
        assertThatThrownBy(() -> invoiceService.recordPayment(inv.id(),
                new RecordPaymentRequest(new BigDecimal("700"), PaymentMode.CARD)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotInvoiceTheSameBookingTwice() {
        BookingResponse booking = newBooking(1);
        invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null));
        assertThatThrownBy(() -> invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotInvoiceACancelledBooking() {
        BookingResponse booking = newBooking(1);
        bookingService.cancel(1L, booking.id());
        assertThatThrownBy(() -> invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotInvoiceAnUnconfirmedBooking() {
        BookingResponse pending = newPendingBooking(1);

        assertThatThrownBy(() -> invoiceService.generate(new GenerateInvoiceRequest(pending.id(), null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not confirmed yet");
    }

    /**
     * The hole this closes: a booking can be cancelled after it was invoiced. The seats go back
     * on sale, but the invoice is a separate row — without a guard we would keep taking money
     * for a booking that no longer exists.
     */
    @Test
    void cannotPayAnInvoiceOnceItsBookingIsCancelled() {
        BookingResponse booking = newBooking(2); // subtotal 600, confirmed
        InvoiceResponse inv = invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null));

        invoiceService.recordPayment(inv.id(), new RecordPaymentRequest(new BigDecimal("100"), PaymentMode.CASH));
        bookingService.cancel(1L, booking.id());

        assertThatThrownBy(() -> invoiceService.recordPayment(
                inv.id(), new RecordPaymentRequest(new BigDecimal("100"), PaymentMode.CASH)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cancelled");

        // the part-payment already taken is untouched; refunds are a separate flow
        assertThat(invoiceService.getById(inv.id()).paidAmount()).isEqualByComparingTo("100");
    }
}
