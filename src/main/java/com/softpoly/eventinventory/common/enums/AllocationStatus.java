package com.softpoly.eventinventory.common.enums;

/**
 * Lifecycle of one allocation of an inventory item to an event.
 *
 * <p>Only ALLOCATED rows hold stock. Moving to RETURNED or CANCELLED puts the quantity back
 * into the item's available pool, so the two terminal states are deliberately distinct: a
 * RETURNED allocation happened and the kit came back, a CANCELLED one never went out.
 */
public enum AllocationStatus {
    ALLOCATED,
    RETURNED,
    CANCELLED
}
