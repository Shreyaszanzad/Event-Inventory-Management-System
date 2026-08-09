package com.softpoly.eventinventory.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * The default sender: writes the message to the log and delivers nothing.
 *
 * <p>Keeps local development and the test suite free of an external dependency, an account, and a
 * per-message cost. Because {@link #isMock()} is true, the OTP endpoint also echoes the code back
 * in its response, which is what makes the dev login flow usable without a phone.
 */
@Component
@ConditionalOnProperty(name = "app.otp.sms-provider", havingValue = "mock", matchIfMissing = true)
public class LoggingSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsSender.class);

    @Override
    public String provider() {
        return "mock";
    }

    @Override
    public boolean isMock() {
        return true;
    }

    @Override
    public void send(String phoneE164, String message) {
        log.info("[mock sms] to {} : {}", phoneE164, message);
    }
}
