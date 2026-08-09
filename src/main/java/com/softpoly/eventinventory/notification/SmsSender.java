package com.softpoly.eventinventory.notification;

/**
 * Abstraction over an SMS provider, in the same shape as {@code PaymentGateway}.
 *
 * <p>Two implementations exist: {@link LoggingSmsSender} (default — writes to the log, sends
 * nothing) and {@link TwilioSmsSender} (active when {@code app.otp.sms-provider=twilio}).
 */
public interface SmsSender {

    /** Provider name, e.g. "mock" or "twilio". */
    String provider();

    /**
     * Whether this sender only pretends to deliver.
     *
     * <p>{@link com.softpoly.eventinventory.auth.OtpService} keys the decision to echo the code
     * back in the API response off this, so a real provider can never leak the OTP — no matter how
     * the other properties are set.
     */
    boolean isMock();

    /**
     * Delivers a message, or throws if it could not be handed to the provider.
     *
     * <p>Throwing matters: the OTP request is transactional, so a failure here rolls the stored
     * token back rather than leaving the caller waiting for a code that was never sent.
     *
     * @param phoneE164 destination in E.164 form, e.g. {@code +919876543210}
     */
    void send(String phoneE164, String message);
}
