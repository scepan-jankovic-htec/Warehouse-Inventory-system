package com.warehouse.inventory.exception;

/**
 * Base class for all domain/business rule violations.
 * All typed exceptions extend this class so the global handler can catch them through a single catch point.
 */
public abstract class BusinessException extends RuntimeException {

    private final String errorCode;

    protected BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
