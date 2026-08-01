package com.warehouse.inventory.dto.response;

/**
 * Represents a single field-level validation error nested inside {@link ApiErrorResponse}.
 */
public class FieldErrorResponse {

    private final String field;
    private final String message;

    public FieldErrorResponse(String field, String message) {
        this.field = field;
        this.message = message;
    }

    public String getField() {
        return field;
    }

    public String getMessage() {
        return message;
    }
}
