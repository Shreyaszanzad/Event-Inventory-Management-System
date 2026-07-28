package com.softpoly.eventinventory.common.time;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Central time source with an explicit application time zone. Using this instead of the bare
 * no-arg now() call avoids depending on the JVM's default zone (and the related
 * static-analysis warning).
 */
public final class AppTime {

    /** The application's canonical time zone. */
    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private AppTime() {}

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }
}
