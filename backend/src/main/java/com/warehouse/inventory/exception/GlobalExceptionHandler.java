package com.warehouse.inventory.exception;

import com.warehouse.inventory.dto.response.ApiErrorResponse;
import com.warehouse.inventory.dto.response.FieldErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Central exception handler.
 *
 * <p>Translates every exception type to the standard {@link ApiErrorResponse} envelope
 * defined in docs/06-api-specification.md section 3.3. No raw Java exception message is
 * ever forwarded to the client. The 500 handler logs the full stack trace but returns only
 * a generic message.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // -------------------------------------------------------------------------
    // Bean Validation failures (400)
    // -------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<FieldErrorResponse> fieldErrors = ex.getBindingResult().getAllErrors().stream()
                .filter(FieldError.class::isInstance)
                .map(FieldError.class::cast)
                .map(fe -> new FieldErrorResponse(fe.getField(), fe.getDefaultMessage()))
                .toList();

        log.warn("Validation failed for [{}] {}: {} field error(s)",
                request.getMethod(), request.getRequestURI(), fieldErrors.size());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR",
                        "Request validation failed. See fieldErrors for details.")
                .timestamp(Instant.now().toString())
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // -------------------------------------------------------------------------
    // Malformed JSON body (400)
    // -------------------------------------------------------------------------

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {

        log.warn("Malformed request body for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.BAD_REQUEST.value(), "MALFORMED_REQUEST",
                        "Request body is missing or contains invalid JSON.")
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // -------------------------------------------------------------------------
    // Wrong type for path / query parameter (400)
    // -------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        String detail = String.format("Parameter '%s' has an invalid value.", ex.getName());
        log.warn("Type mismatch for [{}] {}: {}", request.getMethod(), request.getRequestURI(), detail);

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.BAD_REQUEST.value(), "INVALID_PARAMETER", detail)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // -------------------------------------------------------------------------
    // Resource not found (404)
    // -------------------------------------------------------------------------

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        log.warn("Resource not found for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.NOT_FOUND.value(), ex.getErrorCode(), ex.getMessage())
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // -------------------------------------------------------------------------
    // Duplicate resource (409)
    // -------------------------------------------------------------------------

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(
            DuplicateResourceException ex, HttpServletRequest request) {

        log.warn("Duplicate resource for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.CONFLICT.value(), ex.getErrorCode(), ex.getMessage())
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // -------------------------------------------------------------------------
    // Business rule violations (422)
    // -------------------------------------------------------------------------

    @ExceptionHandler({
            InsufficientStockException.class,
            InactiveResourceException.class,
            InvalidOperationException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBusinessRule(
            BusinessException ex, HttpServletRequest request) {

        log.warn("Business rule violation for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.UNPROCESSABLE_ENTITY.value(), ex.getErrorCode(), ex.getMessage())
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    // -------------------------------------------------------------------------
    // Spring Security — forbidden (403)
    // -------------------------------------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        log.warn("Access denied for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.FORBIDDEN.value(), "ACCESS_DENIED",
                        "You do not have permission to perform this action.")
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // -------------------------------------------------------------------------
    // Spring Security — unauthenticated (401)
    // -------------------------------------------------------------------------

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        log.warn("Authentication failure for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.UNAUTHORIZED.value(), "UNAUTHORIZED",
                        "Authentication is required to access this resource.")
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    // -------------------------------------------------------------------------
    // NoSuchElementException thrown by services when an ID is not found (404)
    // -------------------------------------------------------------------------

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiErrorResponse> handleNoSuchElement(
            NoSuchElementException ex, HttpServletRequest request) {

        log.warn("Resource not found for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.NOT_FOUND.value(), "RESOURCE_NOT_FOUND", ex.getMessage())
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // -------------------------------------------------------------------------
    // ConstraintViolationException thrown by services via programmatic validation (400)
    // -------------------------------------------------------------------------

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        List<FieldErrorResponse> fieldErrors = ex.getConstraintViolations().stream()
                .map(cv -> {
                    String path = cv.getPropertyPath().toString();
                    String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
                    return new FieldErrorResponse(field, cv.getMessage());
                })
                .toList();

        log.warn("Constraint violations for [{}] {}: {} error(s)",
                request.getMethod(), request.getRequestURI(), fieldErrors.size());

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR",
                        "Request validation failed. See fieldErrors for details.")
                .timestamp(Instant.now().toString())
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // -------------------------------------------------------------------------
    // IllegalArgumentException thrown by services for uniqueness or invalid args
    // "already exists" messages map to 409 Conflict; others map to 422.
    // -------------------------------------------------------------------------

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {

        String message = ex.getMessage() != null ? ex.getMessage() : "Invalid request argument.";
        boolean isDuplicate = message.toLowerCase().contains("already exists");
        HttpStatus status = isDuplicate ? HttpStatus.CONFLICT : HttpStatus.UNPROCESSABLE_ENTITY;
        String errorCode = isDuplicate ? "DUPLICATE_RESOURCE" : "INVALID_OPERATION";

        log.warn("IllegalArgumentException for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), message);

        ApiErrorResponse body = ApiErrorResponse
                .builder(status.value(), errorCode, message)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(status).body(body);
    }

    // -------------------------------------------------------------------------
    // IllegalStateException thrown by services for business rule violations (422)
    // -------------------------------------------------------------------------

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalState(
            IllegalStateException ex, HttpServletRequest request) {

        String message = ex.getMessage() != null ? ex.getMessage() : "Operation cannot be performed in the current state.";
        String errorCode = resolveStateErrorCode(message);

        log.warn("Business state violation for [{}] {}: {}",
                request.getMethod(), request.getRequestURI(), message);

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.UNPROCESSABLE_ENTITY.value(), errorCode, message)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    private String resolveStateErrorCode(String message) {
        if (message == null) return "INVALID_OPERATION";
        String lower = message.toLowerCase();
        if (lower.contains("already inactive")) return "ALREADY_INACTIVE";
        if (lower.contains("inactive")) return "INACTIVE_RESOURCE";
        if (lower.contains("insufficient stock") || lower.contains("cannot become negative")) return "INSUFFICIENT_STOCK";
        return "INVALID_OPERATION";
    }

    // -------------------------------------------------------------------------
    // Catch-all (500) — full stack trace logged, generic message to client
    // -------------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error for [{}] {}", request.getMethod(), request.getRequestURI(), ex);

        ApiErrorResponse body = ApiErrorResponse
                .builder(HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR",
                        "An unexpected error occurred. Please try again later.")
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
