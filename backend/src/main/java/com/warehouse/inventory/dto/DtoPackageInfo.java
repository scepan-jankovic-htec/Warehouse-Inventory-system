package com.warehouse.inventory.dto;

/**
 * Package for Data Transfer Objects.
 * 
 * DTOs separate the internal domain model from the external API surface.
 * Domain entities may evolve without breaking the API as long as mappers
 * are updated.
 * 
 * Subpackages:
 * - request: DTOs for inbound API payloads, annotated with Bean Validation
 * - response: DTOs for outbound API payloads, constructed by mappers
 * 
 * Common response wrappers:
 * - PagedResponse<T>: Standard paginated collection response
 * - ApiErrorResponse: Standard error response shape
 * - FieldErrorResponse: Field-level validation errors
 * 
 * Design rules:
 * - No entity field is excluded from mapping accidentally
 * - password_hash is never present in any response DTO
 * - Nested summary objects are used instead of exposing full nested objects
 */
class DtoPackageInfo {
}
