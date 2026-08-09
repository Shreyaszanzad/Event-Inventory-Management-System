package com.softpoly.eventinventory.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.softpoly.eventinventory.billing.Invoice;
import com.softpoly.eventinventory.billing.InvoiceRepository;
import com.softpoly.eventinventory.billing.InvoiceService;
import com.softpoly.eventinventory.billing.dto.InvoiceResponse;
import com.softpoly.eventinventory.billing.dto.RecordPaymentRequest;
import com.softpoly.eventinventory.common.enums.InvoiceStatus;
import com.softpoly.eventinventory.common.enums.PaymentMode;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.payment.dto.CreateOrderResponse;
import com.softpoly.eventinventory.payment.dto.VerifyPaymentRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Bridges the {@link PaymentGateway} and the billing invoices for online payments. */
@Service
public class PaymentService {

    private final PaymentGateway gateway;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;
    private final String currency;

    public PaymentService(PaymentGateway gateway, InvoiceRepository invoiceRepository,
                          InvoiceService invoiceService, ObjectMapper objectMapper,
                          @Value("${app.payment.currency}") String currency) {
        this.gateway = gateway;
        this.invoiceRepository = invoiceRepository;
        this.invoiceService = invoiceService;
        this.objectMapper = objectMapper;
        this.currency = currency;
    }

    /** Creates a gateway order for an invoice's outstanding balance (user pays this). */
    @Transactional
    public CreateOrderResponse createOrder(Long userId, Long invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndUserId(invoiceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id " + invoiceId));
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice is already fully paid");
        }

        long amountMinor = invoice.getBalanceAmount().movePointRight(2).longValueExact(); // rupees -> paise
        String orderId = gateway.createOrder(amountMinor, invoice.getInvoiceNumber());
        invoice.setGatewayOrderId(orderId);
        invoiceRepository.save(invoice);

        return new CreateOrderResponse(gateway.provider(), gateway.keyId(), orderId,
                amountMinor, currency, invoice.getId(), invoice.getInvoiceNumber());
    }

    /**
     * Verifies the client-side payment callback and records the payment on the invoice.
     *
     * <p>Transactional for the sake of the already-settled path: {@link #settle} short-circuits by
     * building a response straight from the loaded invoice, and its {@code payments} collection is
     * lazy. Without a session open that read fails, which turns a harmless duplicate callback into
     * a 500.
     */
    @Transactional
    public InvoiceResponse verifyAndRecord(Long userId, VerifyPaymentRequest request) {
        if (!gateway.verifyPaymentSignature(request.orderId(), request.paymentId(), request.signature())) {
            throw new BadRequestException("Payment signature verification failed");
        }
        Invoice invoice = invoiceRepository.findByGatewayOrderId(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("No invoice for order " + request.orderId()));
        if (!invoice.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("No invoice for order " + request.orderId());
        }
        return settle(invoice);
    }

    /**
     * Handles a server-to-server webhook from the gateway (the reliable confirmation path).
     *
     * <p>Gateways retry webhooks until they get a 2xx, so this has to be safe to call repeatedly
     * for the same order — hence both the idempotency check in {@link #settle} and the open
     * session here.
     */
    @Transactional
    public void handleWebhook(String payload, String signature) {
        if (!gateway.verifyWebhookSignature(payload, signature)) {
            throw new BadRequestException("Invalid webhook signature");
        }
        String orderId;
        String event;
        try {
            JsonNode root = objectMapper.readTree(payload);
            event = root.path("event").asText("");
            orderId = extractOrderId(root);
        } catch (Exception e) {
            throw new BadRequestException("Malformed webhook payload");
        }
        boolean paid = event.equals("payment.captured") || event.equals("order.paid");
        if (!paid || orderId.isBlank()) {
            return; // ignore events we don't act on
        }
        invoiceRepository.findByGatewayOrderId(orderId).ifPresent(this::settle);
    }

    /** Records the full outstanding balance as an ONLINE payment; idempotent once PAID. */
    private InvoiceResponse settle(Invoice invoice) {
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            return InvoiceResponse.from(invoice); // already settled — don't double-charge
        }
        return invoiceService.recordPayment(invoice.getId(),
                new RecordPaymentRequest(invoice.getBalanceAmount(), PaymentMode.ONLINE));
    }

    private String extractOrderId(JsonNode root) {
        JsonNode payment = root.path("payload").path("payment").path("entity").path("order_id");
        if (!payment.isMissingNode() && !payment.asText().isBlank()) {
            return payment.asText();
        }
        return root.path("payload").path("order").path("entity").path("id").asText("");
    }
}
