package com.softpoly.eventinventory.common.exception;

/** Thrown for invalid input or a broken business rule. Mapped to HTTP 400. */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
