package com.warehouse.inventory.exception;

/**
 * Raised for logically invalid operations — same-location transfer, already-inactive resource,
 * invalid date range in history queries, and similar cases.
 * Maps to HTTP 422 Unprocessable Entity.
 */
public class InvalidOperationException extends BusinessException {

    public InvalidOperationException(String message) {
        super(message, "INVALID_OPERATION");
    }

    public InvalidOperationException(String message, String errorCode) {
        super(message, errorCode);
    }
}
