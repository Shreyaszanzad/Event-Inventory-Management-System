package com.softpoly.eventinventory.common.enums;

/**
 * Whether an inventory item may still be allocated.
 *
 * <p>RETIRED is the soft-delete: damaged or written-off stock keeps its allocation history
 * (which a hard delete could not, since the foreign keys are ON DELETE RESTRICT) but can no
 * longer be assigned to new events.
 */
public enum InventoryStatus {
    ACTIVE,
    RETIRED
}
