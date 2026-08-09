package com.softpoly.eventinventory.payment;

import com.softpoly.eventinventory.billing.dto.InvoiceResponse;
import com.softpoly.eventinventory.common.dto.ApiResponse;
import com.softpoly.eventinventory.payment.dto.CreateOrderRequest;
import com.softpoly.eventinventory.payment.dto.CreateOrderResponse;
import com.softpoly.eventinventory.payment.dto.VerifyPaymentRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Online payment endpoints.
 * /orders and /verify are user-authenticated; /webhook is public (the gateway calls it) and is
 * secured by its signature instead of a JWT.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /** Step 1 — create a gateway order for an invoice (frontend opens checkout with this). */
    @PostMapping("/orders")
    public ApiResponse<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                                        Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(paymentService.createOrder(userId, request.invoiceId()));
    }

    /** Step 2 — verify the checkout callback and mark the invoice paid. */
    @PostMapping("/verify")
    public ApiResponse<InvoiceResponse> verify(@Valid @RequestBody VerifyPaymentRequest request,
                                               Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok("Payment verified", paymentService.verifyAndRecord(userId, request));
    }

    /** Server-to-server confirmation from the gateway (reliable path). Public, signature-verified. */
    @PostMapping("/webhook")
    public ApiResponse<Void> webhook(@RequestBody String payload,
                                     @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature);
        return ApiResponse.ok("ok", null);
    }
}
