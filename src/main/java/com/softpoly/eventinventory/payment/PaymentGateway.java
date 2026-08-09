package com.softpoly.eventinventory.payment;

/**
 * Abstraction over a payment provider. Two implementations exist:
 * {@code MockPaymentGateway} (default — no external calls, used for local/dev/tests) and
 * {@code RazorpayPaymentGateway} (active when app.payment.provider=razorpay).
 */
public interface PaymentGateway {

    /** Provider name, e.g. "mock" or "razorpay". */
    String provider();

    /** Public key id the frontend checkout needs (never the secret). */
    String keyId();

    /** Creates an order for the given amount (in the smallest currency unit, i.e. paise) — returns its id. */
    String createOrder(long amountMinor, String receipt);

    /** Verifies the signature returned to the client after a successful payment. */
    boolean verifyPaymentSignature(String orderId, String paymentId, String signature);

    /** Verifies the signature on a server-to-server webhook callback. */
    boolean verifyWebhookSignature(String payload, String signature);
}
