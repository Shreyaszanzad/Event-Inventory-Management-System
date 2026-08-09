package com.softpoly.eventinventory.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Default gateway used when no real provider is configured. It makes no external calls, so the
 * whole online-payment flow works locally and in tests. Signatures use a fixed secret so a test
 * (or the demo frontend) can produce a valid signature.
 */
@Component
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "mock", matchIfMissing = true)
public class MockPaymentGateway implements PaymentGateway {

    /** Fixed secret so tests/demos can compute a signature the mock will accept. */
    public static final String MOCK_SECRET = "mock_secret_key";

    private final SecureRandom random = new SecureRandom();

    @Override
    public String provider() {
        return "mock";
    }

    @Override
    public String keyId() {
        return "mock_key_id";
    }

    @Override
    public String createOrder(long amountMinor, String receipt) {
        return "order_mock_" + Long.toHexString(random.nextLong() & 0xffffffffffffffL);
    }

    @Override
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        String expected = PaymentSignatures.hmacSha256Hex(orderId + "|" + paymentId, MOCK_SECRET);
        return PaymentSignatures.matches(expected, signature);
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        return PaymentSignatures.matches(PaymentSignatures.hmacSha256Hex(payload, MOCK_SECRET), signature);
    }
}
