package com.warehouse.inventory.exception;

/**
 * Raised when a requested resource (by ID) does not exist.
 * Maps to HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND");
    }
}
