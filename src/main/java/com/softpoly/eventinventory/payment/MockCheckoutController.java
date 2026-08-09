package com.softpoly.eventinventory.payment;

import com.softpoly.eventinventory.common.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;

/**
 * Stands in for Razorpay's hosted checkout while the mock provider is active.
 *
 * <p>With a real gateway the browser opens Razorpay's own modal, the customer pays, and Razorpay
 * hands the page back three values — order id, payment id and a signature — which the frontend
 * posts to {@code /api/payments/verify}. There is no gateway here to produce those, and the
 * signature is an HMAC keyed by a secret that must never reach the browser, so this endpoint plays
 * the gateway's part: it returns a payment id and a signature the mock will accept.
 *
 * <p>The point is that everything downstream stays honest — {@code /verify} still checks the
 * signature, so the demo exercises the same verification path the real integration will.
 *
 * <p><b>Only exists when {@code app.payment.provider=mock}.</b> Switching to the razorpay provider
 * removes this bean entirely, so it cannot be reached in a real deployment.
 */
@RestController
@RequestMapping("/api/payments/mock")
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "mock", matchIfMissing = true)
public class MockCheckoutController {

    private final SecureRandom random = new SecureRandom();

    /**
     * Simulates the customer completing payment in the gateway's checkout sheet.
     *
     * @return the payment id and signature the frontend should post to {@code /verify}
     */
    @PostMapping("/pay")
    public ApiResponse<MockPaymentResult> pay(@Valid @RequestBody MockPayRequest request) {
        String paymentId = "pay_mock_" + Long.toHexString(random.nextLong() & 0xffffffffffffffL);
        String signature = PaymentSignatures.hmacSha256Hex(
                request.orderId() + "|" + paymentId, MockPaymentGateway.MOCK_SECRET);

        return ApiResponse.ok("Mock payment captured", new MockPaymentResult(
                request.orderId(), paymentId, signature));
    }

    public record MockPayRequest(
            @NotBlank(message = "orderId is required") String orderId
    ) {}

    /** Mirrors the shape Razorpay's checkout handler gives the browser. */
    public record MockPaymentResult(String orderId, String paymentId, String signature) {}
}
