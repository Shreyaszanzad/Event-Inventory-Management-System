package com.softpoly.eventinventory.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lightweight in-memory fixed-window rate limiter (no external dependency).
 * Suitable for a single-instance deployment; for a multi-instance/prod setup, back this with Redis.
 *
 * <p>Each key (e.g. "otp-req:phone:9876543210") gets a counter that resets once its time window
 * elapses. {@link #isAllowed} atomically checks-and-increments per key.
 */
@Service
public class RateLimiterService {

    private static final class Window {
        long windowStartMs;
        int count;
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * @return true if the action is within the limit (and records it); false if the limit is exceeded.
     */
    public boolean isAllowed(String key, int maxRequests, long windowMs) {
        final long now = System.currentTimeMillis();
        final boolean[] allowed = {false};
        windows.compute(key, (k, w) -> {
            if (w == null || now - w.windowStartMs >= windowMs) {
                w = new Window();
                w.windowStartMs = now;
                w.count = 0;
            }
            if (w.count < maxRequests) {
                w.count++;
                allowed[0] = true;
            }
            return w;
        });
        return allowed[0];
    }
}
