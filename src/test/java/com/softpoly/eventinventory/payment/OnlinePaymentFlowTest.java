package com.softpoly.eventinventory.payment;

import com.softpoly.eventinventory.billing.InvoiceRepository;
import com.softpoly.eventinventory.billing.InvoiceService;
import com.softpoly.eventinventory.billing.dto.InvoiceResponse;
import com.softpoly.eventinventory.billing.dto.GenerateInvoiceRequest;
import com.softpoly.eventinventory.booking.BookingService;
import com.softpoly.eventinventory.booking.dto.BookingResponse;
import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.enums.InvoiceStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.event.Event;
import com.softpoly.eventinventory.event.EventRepository;
import com.softpoly.eventinventory.payment.dto.CreateOrderResponse;
import com.softpoly.eventinventory.payment.dto.VerifyPaymentRequest;
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

/** End-to-end online-payment flow against the mock gateway (no real provider needed). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimstest;DB_CLOSE_DELAY=-1;MODE=MySQL;LOCK_TIMEOUT=15000",
        "app.booking.sweeper-initial-ms=3600000",
        "app.payment.provider=mock"
})
class OnlinePaymentFlowTest {

    @Autowired EventRepository eventRepository;
    @Autowired ShowRepository showRepository;
    @Autowired TicketTypeRepository ticketTypeRepository;
    @Autowired BookingService bookingService;
    @Autowired InvoiceService invoiceService;
    @Autowired InvoiceRepository invoiceRepository;
    @Autowired PaymentService paymentService;

    private InvoiceResponse newInvoiceFor2Tickets() {
        Event event = eventRepository.save(Event.builder()
                .title("Pay Show").type(EventType.TICKETED).status("ACTIVE").build());
        Show show = showRepository.save(Show.builder()
                .eventId(event.getId()).showDatetime(LocalDateTime.now().plusDays(1)).build());
        TicketType tier = ticketTypeRepository.save(TicketType.builder()
                .showId(show.getId()).name("General").price(new BigDecimal("300"))
                .totalQty(100).availableQty(100).build());
        BookingResponse booking = bookingService.create(1L,
                new CreateBookingRequest(show.getId(), List.of(new CreateBookingRequest.Item(tier.getId(), 2))));
        // Only a confirmed booking can be invoiced — a PENDING hold is not a sale yet.
        bookingService.confirm(1L, booking.id());
        return invoiceService.generate(new GenerateInvoiceRequest(booking.id(), null)); // total 600
    }

    @Test
    void createOrderThenVerifiedCallbackSettlesInvoice() {
        InvoiceResponse invoice = newInvoiceFor2Tickets();

        CreateOrderResponse order = paymentService.createOrder(1L, invoice.id());
        assertThat(order.provider()).isEqualTo("mock");
        assertThat(order.orderId()).startsWith("order_mock_");
        assertThat(order.amountMinor()).isEqualTo(60000L); // ₹600 -> paise

        String paymentId = "pay_test_123";
        String signature = PaymentSignatures.hmacSha256Hex(
                order.orderId() + "|" + paymentId, MockPaymentGateway.MOCK_SECRET);

        InvoiceResponse settled = paymentService.verifyAndRecord(1L,
                new VerifyPaymentRequest(order.orderId(), paymentId, signature));

        assertThat(settled.status()).isEqualTo("PAID");
        assertThat(settled.balanceAmount()).isEqualByComparingTo("0");
        assertThat(settled.payments()).anyMatch(p -> p.mode().equals("ONLINE"));
    }

    /**
     * Gateways retry until they get a 2xx, and a customer can double-click. Replaying the same
     * callback must return the settled invoice, not blow up and not charge twice.
     */
    @Test
    void replayingTheSameCallbackIsIdempotent() {
        InvoiceResponse invoice = newInvoiceFor2Tickets();
        CreateOrderResponse order = paymentService.createOrder(1L, invoice.id());

        String paymentId = "pay_replay_1";
        String signature = PaymentSignatures.hmacSha256Hex(
                order.orderId() + "|" + paymentId, MockPaymentGateway.MOCK_SECRET);
        VerifyPaymentRequest callback = new VerifyPaymentRequest(order.orderId(), paymentId, signature);

        InvoiceResponse first = paymentService.verifyAndRecord(1L, callback);
        InvoiceResponse second = paymentService.verifyAndRecord(1L, callback);

        assertThat(first.status()).isEqualTo("PAID");
        assertThat(second.status()).isEqualTo("PAID");
        assertThat(second.paidAmount()).isEqualByComparingTo(first.paidAmount());
        // one payment row, not two — the invoice was not charged again
        assertThat(second.payments()).hasSize(1);
    }

    @Test
    void tamperedSignatureIsRejected() {
        InvoiceResponse invoice = newInvoiceFor2Tickets();
        CreateOrderResponse order = paymentService.createOrder(1L, invoice.id());

        assertThatThrownBy(() -> paymentService.verifyAndRecord(1L,
                new VerifyPaymentRequest(order.orderId(), "pay_x", "forged_signature")))
                .isInstanceOf(BadRequestException.class);

        assertThat(invoiceRepository.findById(invoice.id()).orElseThrow().getStatus())
                .isNotEqualTo(InvoiceStatus.PAID);
    }

    @Test
    void webhookWithValidSignatureSettlesInvoice() {
        InvoiceResponse invoice = newInvoiceFor2Tickets();
        CreateOrderResponse order = paymentService.createOrder(1L, invoice.id());

        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{"
                + "\"order_id\":\"" + order.orderId() + "\",\"status\":\"captured\"}}}}";
        String signature = PaymentSignatures.hmacSha256Hex(payload, MockPaymentGateway.MOCK_SECRET);

        paymentService.handleWebhook(payload, signature);

        assertThat(invoiceRepository.findById(invoice.id()).orElseThrow().getStatus())
                .isEqualTo(InvoiceStatus.PAID);
    }
}
