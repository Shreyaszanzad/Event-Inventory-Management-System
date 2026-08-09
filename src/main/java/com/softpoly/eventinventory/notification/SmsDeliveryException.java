package com.softpoly.eventinventory.notification;

/**
 * The provider would not accept the message.
 *
 * <p>Carries a message that is safe to show a caller — the underlying cause (which may quote the
 * request, including the OTP) stays in the logs.
 */
public class SmsDeliveryException extends RuntimeException {

    public SmsDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
