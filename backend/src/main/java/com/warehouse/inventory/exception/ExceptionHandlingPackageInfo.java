package com.warehouse.inventory.exception;

/**
 * Package for custom exceptions and global exception handling.
 * 
 * This package contains:
 * 
 * 1. Custom Business Exceptions:
 *    - DuplicateResourceException: Raised when SKU, category name, or location
 *      name uniqueness is violated.
 *    - InactiveResourceException: Raised when attempting to use an inactive
 *      category, product, or location for new operations.
 *    - InsufficientStockException: Raised when transfer quantity exceeds
 *      available stock or adjustment would result in negative inventory.
 *    - InvalidOperationException: Raised for transfer source == destination
 *      or invalid date range in history queries.
 *    - ResourceNotFoundException: Raised when a requested resource does not exist.
 * 
 * 2. Global Exception Handler:
 *    - GlobalExceptionHandler: Catches all exceptions (business and system),
 *      logs them with correlation IDs, and returns consistent ApiErrorResponse
 *      objects with appropriate HTTP status codes.
 * 
 *    Handled exception types and their status codes:
 *    - ResourceNotFoundException -> 404 Not Found
 *    - DuplicateResourceException -> 409 Conflict
 *    - InactiveResourceException -> 422 Unprocessable Entity
 *    - InsufficientStockException -> 422 Unprocessable Entity
 *    - InvalidOperationException -> 409 Conflict
 *    - MethodArgumentNotValidException -> 400 Bad Request (fieldErrors populated)
 *    - Other exceptions -> 500 Internal Server Error
 * 
 * All error responses include timestamp, correlation ID, and structured
 * error information for debugging.
 */
class ExceptionHandlingPackageInfo {
}
