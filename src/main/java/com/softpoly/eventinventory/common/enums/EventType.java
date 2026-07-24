package com.softpoly.eventinventory.common.enums;

/**
 * TICKETED  - public event users can book (movie, comedy, amusement, live event).
 * INVENTORY - admin-only event that consumes physical inventory; not shown in the public feed.
 */
public enum EventType {
    TICKETED,
    INVENTORY
}
