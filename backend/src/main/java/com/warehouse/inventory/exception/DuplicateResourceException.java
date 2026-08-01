package com.warehouse.inventory.exception;

/**
 * Raised when a unique constraint would be violated (SKU, category name, location name, email).
 * Maps to HTTP 409 Conflict.
 */
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String message) {
        super(message, "DUPLICATE_RESOURCE");
    }
}
