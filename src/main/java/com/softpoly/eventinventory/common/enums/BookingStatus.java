package com.softpoly.eventinventory.common.enums;

/**
 * PENDING   - seats are held awaiting payment (has an expiry).
 * CONFIRMED - payment done, seats secured.
 * CANCELLED - user cancelled; seats released.
 * EXPIRED   - hold timed out before payment; seats released automatically.
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    EXPIRED
}
