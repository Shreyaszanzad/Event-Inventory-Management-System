package com.softpoly.eventinventory.payment;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The HMAC signature scheme must be deterministic and reject tampered signatures. */
class PaymentSignaturesTest {

    @Test
    void hmacIsDeterministicAndVerifiable() {
        String data = "order_ABC|pay_XYZ";
        String secret = "test_secret";

        String sig = PaymentSignatures.hmacSha256Hex(data, secret);

        assertThat(sig).hasSize(64); // 32 bytes as hex
        assertThat(PaymentSignatures.matches(sig, PaymentSignatures.hmacSha256Hex(data, secret))).isTrue();
        assertThat(PaymentSignatures.matches(sig, PaymentSignatures.hmacSha256Hex(data, "wrong_secret"))).isFalse();
        assertThat(PaymentSignatures.matches(sig, "not-a-real-signature")).isFalse();
        assertThat(PaymentSignatures.matches(sig, null)).isFalse();
    }
}
