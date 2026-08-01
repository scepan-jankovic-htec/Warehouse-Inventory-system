package com.warehouse.inventory.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Standard error envelope returned for all API error responses.
 * Conforms to the shape defined in docs/06-api-specification.md section 3.3.
 *
 * {@code fieldErrors} is omitted from serialization when null/empty.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private final int status;
    private final String error;
    private final String message;
    private final String timestamp;
    private final List<FieldErrorResponse> fieldErrors;

    private ApiErrorResponse(Builder builder) {
        this.status = builder.status;
        this.error = builder.error;
        this.message = builder.message;
        this.timestamp = builder.timestamp;
        this.fieldErrors = (builder.fieldErrors == null || builder.fieldErrors.isEmpty())
                ? null
                : builder.fieldErrors;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public List<FieldErrorResponse> getFieldErrors() {
        return fieldErrors;
    }

    // -------------------------------------------------------------------------
    // Builder
    // -------------------------------------------------------------------------

    public static Builder builder(int status, String error, String message) {
        return new Builder(status, error, message);
    }

    public static final class Builder {
        private final int status;
        private final String error;
        private final String message;
        private String timestamp = Instant.now().toString();
        private List<FieldErrorResponse> fieldErrors;

        private Builder(int status, String error, String message) {
            this.status = status;
            this.error = error;
            this.message = message;
        }

        public Builder timestamp(String timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder fieldErrors(List<FieldErrorResponse> fieldErrors) {
            this.fieldErrors = fieldErrors;
            return this;
        }

        public ApiErrorResponse build() {
            return new ApiErrorResponse(this);
        }
    }
}
