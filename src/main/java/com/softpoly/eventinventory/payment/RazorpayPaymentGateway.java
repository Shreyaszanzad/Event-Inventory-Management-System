package com.softpoly.eventinventory.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Razorpay implementation, active only when app.payment.provider=razorpay. Order creation calls the
 * Razorpay REST API with HTTP Basic auth (key id + secret); signatures are verified with HMAC-SHA256.
 * Keys come from environment variables — the secret never leaves the server.
 */
@Component
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "razorpay")
public class RazorpayPaymentGateway implements PaymentGateway {

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final String currency;
    private final RestClient client = RestClient.builder().baseUrl("https://api.razorpay.com/v1").build();

    public RazorpayPaymentGateway(
            @Value("${app.payment.razorpay.key-id}") String keyId,
            @Value("${app.payment.razorpay.key-secret}") String keySecret,
            @Value("${app.payment.razorpay.webhook-secret}") String webhookSecret,
            @Value("${app.payment.currency}") String currency) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.currency = currency;
    }

    @Override
    public String provider() {
        return "razorpay";
    }

    @Override
    public String keyId() {
        return keyId;
    }

    @Override
    public String createOrder(long amountMinor, String receipt) {
        String basic = Base64.getEncoder()
                .encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
        JsonNode response = client.post()
                .uri("/orders")
                .header("Authorization", "Basic " + basic)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("amount", amountMinor, "currency", currency, "receipt", receipt))
                .retrieve()
                .body(JsonNode.class);
        if (response == null || response.get("id") == null) {
            throw new BadRequestException("Payment gateway did not return an order id");
        }
        return response.get("id").asText();
    }

    @Override
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        String expected = PaymentSignatures.hmacSha256Hex(orderId + "|" + paymentId, keySecret);
        return PaymentSignatures.matches(expected, signature);
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        return PaymentSignatures.matches(PaymentSignatures.hmacSha256Hex(payload, webhookSecret), signature);
    }
}
