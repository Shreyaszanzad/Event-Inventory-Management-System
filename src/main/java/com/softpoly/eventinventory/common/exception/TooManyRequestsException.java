package com.softpoly.eventinventory.common.exception;

/** Thrown when a client exceeds a rate limit. Mapped to HTTP 429. */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
