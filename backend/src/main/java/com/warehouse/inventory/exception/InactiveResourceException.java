package com.warehouse.inventory.exception;

/**
 * Raised when an operation targets an inactive product, category, or location.
 * Maps to HTTP 422 Unprocessable Entity.
 */
public class InactiveResourceException extends BusinessException {

    public InactiveResourceException(String message) {
        super(message, "INACTIVE_RESOURCE");
    }
}
