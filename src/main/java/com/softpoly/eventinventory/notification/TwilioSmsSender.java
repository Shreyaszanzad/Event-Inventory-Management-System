package com.softpoly.eventinventory.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Sends through Twilio's Messages API. Active when {@code app.otp.sms-provider=twilio}.
 *
 * <p>Deliberately a plain REST call rather than the Twilio SDK: one endpoint with three form
 * fields does not justify the dependency, and this keeps the build free of it.
 *
 * <p>Credentials come from the environment ({@code TWILIO_ACCOUNT_SID}, {@code TWILIO_AUTH_TOKEN},
 * {@code TWILIO_FROM_NUMBER}) and must never be committed. The auth token is a bearer to the whole
 * account, so it is never logged, not even on failure.
 */
@Component
@ConditionalOnProperty(name = "app.otp.sms-provider", havingValue = "twilio")
public class TwilioSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsSender.class);
    private static final String API_ROOT = "https://api.twilio.com/2010-04-01/Accounts/";

    private final RestClient http;
    private final String accountSid;
    private final String fromNumber;

    public TwilioSmsSender(@Value("${app.otp.twilio.account-sid}") String accountSid,
                           @Value("${app.otp.twilio.auth-token}") String authToken,
                           @Value("${app.otp.twilio.from-number}") String fromNumber,
                           RestClient.Builder builder) {
        this.accountSid = accountSid;
        this.fromNumber = fromNumber;

        if (accountSid.isBlank() || authToken.isBlank() || fromNumber.isBlank()) {
            throw new IllegalStateException(
                    "app.otp.sms-provider=twilio needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and "
                            + "TWILIO_FROM_NUMBER. Refusing to start rather than silently failing to "
                            + "deliver every OTP.");
        }

        String basic = Base64.getEncoder().encodeToString(
                (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        this.http = builder
                .baseUrl(API_ROOT + accountSid + "/Messages.json")
                .defaultHeader("Authorization", "Basic " + basic)
                .build();
    }

    @Override
    public String provider() {
        return "twilio";
    }

    @Override
    public boolean isMock() {
        return false;
    }

    @Override
    public void send(String phoneE164, String message) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", phoneE164);
        form.add("From", fromNumber);
        form.add("Body", message);

        try {
            http.post()
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();

            // Never log the message: it contains the OTP.
            log.info("Sent OTP SMS via Twilio to {}", mask(phoneE164));

        } catch (Exception e) {
            // Twilio's error body can quote the request, so log only the type and message and let
            // the caller's transaction roll the token back.
            log.error("Twilio refused to send to {} : {}", mask(phoneE164), e.getMessage());
            throw new SmsDeliveryException("Could not send the OTP. Please try again shortly.", e);
        }
    }

    /** Logs never carry a full phone number. */
    private String mask(String phoneE164) {
        if (phoneE164 == null || phoneE164.length() < 4) {
            return "****";
        }
        return "*".repeat(phoneE164.length() - 4) + phoneE164.substring(phoneE164.length() - 4);
    }
}
