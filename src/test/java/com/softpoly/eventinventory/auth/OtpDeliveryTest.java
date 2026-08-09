package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.notification.SmsSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Where the OTP goes, and — more importantly — where it does not.
 *
 * <p>The echo of the raw code in the API response is a development convenience that must never
 * survive contact with a real provider. These pin that down, since the failure mode is silent:
 * everything still works, the code is just also handed to whoever asked for it.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimsotpsend;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "app.otp.mock-enabled=true",
        "app.otp.resend-cooldown-seconds=0",
        "app.booking.sweeper-initial-ms=3600000"
})
class OtpDeliveryTest {

    /** Stands in for a real provider: not a mock, and records what it was asked to send. */
    static class RecordingSmsSender implements SmsSender {
        final List<String[]> sent = new ArrayList<>();
        boolean pretendToBeMock = true;

        @Override public String provider() { return pretendToBeMock ? "mock" : "recording"; }
        @Override public boolean isMock() { return pretendToBeMock; }
        @Override public void send(String phoneE164, String message) { sent.add(new String[]{phoneE164, message}); }
    }

    @TestConfiguration
    static class Config {
        @Bean @Primary RecordingSmsSender recordingSmsSender() { return new RecordingSmsSender(); }
    }

    @Autowired OtpService otpService;
    @Autowired RecordingSmsSender sms;

    @BeforeEach
    void reset() {
        sms.sent.clear();
        sms.pretendToBeMock = true;
    }

    @Test
    void theCodeIsSentToTheNumberInE164Form() {
        otpService.generateOtp("9876500001", "127.0.0.1");

        assertThat(sms.sent).hasSize(1);
        assertThat(sms.sent.get(0)[0]).isEqualTo("+919876500001");
    }

    @Test
    void theMessageCarriesTheCodeAndAWarning() {
        String code = otpService.generateOtp("9876500002", "127.0.0.1");

        String body = sms.sent.get(0)[1];
        assertThat(body).contains(code);
        assertThat(body).contains("Do not share");
    }

    @Test
    void aMockSenderEchoesTheCodeBackForDevelopment() {
        sms.pretendToBeMock = true;

        assertThat(otpService.generateOtp("9876500003", "127.0.0.1")).isNotNull();
    }

    /** The one that matters: a real provider must never hand the code back to the caller. */
    @Test
    void aRealSenderNeverEchoesTheCode() {
        sms.pretendToBeMock = false;

        String echoed = otpService.generateOtp("9876500004", "127.0.0.1");

        assertThat(echoed).isNull();
        // …but it was still delivered
        assertThat(sms.sent).hasSize(1);
    }

    @Test
    void aNumberThatAlreadyHasACountryCodeIsLeftAlone() {
        otpService.generateOtp("+441632960001", "127.0.0.1");

        assertThat(sms.sent.get(0)[0]).isEqualTo("+441632960001");
    }
}
