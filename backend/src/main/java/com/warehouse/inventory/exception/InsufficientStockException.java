package com.warehouse.inventory.exception;

/**
 * Raised when a transfer or adjustment would result in negative stock at the source location.
 * Maps to HTTP 422 Unprocessable Entity.
 */
public class InsufficientStockException extends BusinessException {

    public InsufficientStockException(String message) {
        super(message, "INSUFFICIENT_STOCK");
    }
}
